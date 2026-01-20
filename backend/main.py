import os
import random
from fastapi import FastAPI, Request, Cookie, HTTPException, Depends, Response, BackgroundTasks
from datetime import datetime, timedelta, timezone
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import httpx
import time
from pydantic import BaseModel
from sqlalchemy.orm import Session
import secrets
import json
from typing import List, Optional

import databaseOperate
import emailSender
import password

SESSION_EXPIRE_SEC = 86400

app = FastAPI()

class LoginRequest(BaseModel):
    name: str 
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    code: str
    email: str = None

class EmailSchema(BaseModel):
    email: str

class VerificationRequest(BaseModel):
    email: str
    code: str

class PostCreateRequest(BaseModel):
    title: str
    content: str
    board_id: int
    tags: List[str] = []

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.get("/api/check-session")
def check_session(request: Request, db: Session = Depends(databaseOperate.get_db)):
    token = request.cookies.get("auth_token")
    if not token:
        return None

    # 1. 從資料庫獲取資料
    result = databaseOperate.get_user_by_session_dynamic(db, token)
    
    if not result:
        return None

    # 2. 檢查時間邏輯
    # 資料庫儲存的是 UTC 時間，這裡也要用 datetime.now(timezone.utc)
    if datetime.now(timezone.utc) - result.created_at > timedelta(seconds=SESSION_EXPIRE_SEC):
        print(f"Session 過期: {result.username}")
        databaseOperate.delete_user_session(db, token)
        return None

    # 3. 驗證通過
    return {
        "name": result.username,
        "user_id": str(result.user_id)
    }

@app.post("/api/register")
def register(register_data: RegisterRequest, 
           response: Response, 
           db: Session = Depends(databaseOperate.get_db)):
    is_valid = databaseOperate.verify_code(db, register_data.email, register_data.code)
    if not is_valid:
        raise HTTPException(status_code=400, detail="驗證碼錯誤或失效，請重新操作")
    # 1. 檢查使用者名稱是否已存在
    existing_user = databaseOperate.get_user_by_username(db, register_data.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="使用者名稱已被佔用")
    if register_data.email and databaseOperate.get_user_by_email(db, register_data.email):
        raise HTTPException(status_code=400, detail="此 Email 已被註冊")

    hashed_pwd = password.PasswordManager.hash_password(register_data.password)

    try:
        new_id = databaseOperate.create_user(
            db, 
            username=register_data.username, 
            hashed_pwd=hashed_pwd, 
            email=register_data.email
        )
        databaseOperate.delete_verification_code(db, register_data.email)
        return {"status": "success", "user_id": new_id, "message": "註冊成功！"}
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail="註冊失敗")

@app.post("/api/login")
def login(login_data: LoginRequest, 
          response: Response, 
          db: Session = Depends(databaseOperate.get_db)):
    time.sleep(0.5)
    # 1. 查詢使用者
    user_result = databaseOperate.get_user_by_username(db, login_data.name)

    if not user_result:
        raise HTTPException(status_code=401, detail="帳號或密碼錯誤，請重新輸入")

    # 2. 驗證密碼
    if not password.PasswordManager.verify_password(login_data.password, user_result.password_hash):
        raise HTTPException(status_code=401, detail="帳號或密碼錯誤，請重新輸入")
    # 3. Session Token
    token = secrets.token_urlsafe(32)

    # 4. 寫入 Session (呼叫 databaseOperate)
    try:
        databaseOperate.create_user_session(db, user_result.user_id, token)
    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="系統錯誤，無法登入，請稍後再試。")
    
    # 5. 設定 Cookie
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=SESSION_EXPIRE_SEC
    )
    
    databaseOperate.update_last_login(db, user_result.user_id)
    
    return {
        "name": user_result.username,
        "user_id": str(user_result.user_id),
        "status": "success"
    }

@app.post("/api/logout")
def logout(
    response: Response, 
    auth_token: str = Cookie(None), 
    db: Session = Depends(databaseOperate.get_db)
):
    if auth_token:
        # 1. 從資料庫刪除該 Session (呼叫 databaseOperate)
        databaseOperate.delete_user_session(db, auth_token)

    # 2. 叫瀏覽器刪除 Cookie
    response.delete_cookie(key="auth_token")
    
    return {"status": "success", "message": "已成功登出"}

@app.post("/api/send-code")
def send_code(data: EmailSchema, background_tasks: BackgroundTasks, db: Session = Depends(databaseOperate.get_db)):
    # 檢查 Email 是否已經被註冊過
    if databaseOperate.get_user_by_email(db, data.email):
         raise HTTPException(status_code=400, detail="此 Email 已經被註冊")

    # 生成 6 位數驗證碼
    code = str(random.randint(100000, 999999))
    
    # 存入資料庫
    databaseOperate.save_verification_code(db, data.email, code)
    
    # 關鍵：使用 BackgroundTasks 在背景寄信，才不會讓使用者卡在轉圈圈
    background_tasks.add_task(emailSender.send_verification_email, data.email, code)
    
    return {"message": "驗證碼已發送"}

@app.post("/api/check-code")
def check_code(req: VerificationRequest, db: Session = Depends(databaseOperate.get_db)):
    """
    前端在顯示帳號密碼欄位前，先呼叫這個 API 確認驗證碼是否正確
    """
    is_valid = databaseOperate.verify_code(db, req.email, req.code)
    if not is_valid:
        raise HTTPException(status_code=400, detail="驗證碼錯誤或已過期")
    
    return {"message": "驗證成功", "status": "ok"}

def get_current_user(request: Request, db: Session = Depends(databaseOperate.get_db)):
    """
    Dependency to get the current logged-in user from the cookie.
    Returns the user object if valid, otherwise raises 401.
    """
    token = request.cookies.get("auth_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_data = databaseOperate.get_user_by_session_dynamic(db, token)
    
    if not user_data:
        raise HTTPException(status_code=401, detail="Session invalid")

    # Check expiration (reuse logic)
    if datetime.now(timezone.utc) - user_data.created_at > timedelta(seconds=SESSION_EXPIRE_SEC):
        databaseOperate.delete_user_session(db, token)
        raise HTTPException(status_code=401, detail="Session expired")

    return user_data

# 2. 修改 API 路由
@app.post("/api/posts")
def create_new_post(
    post: PostCreateRequest, 
    user = Depends(get_current_user),
    db: Session = Depends(databaseOperate.get_db)
):
    try:
        # 將資料傳給 databaseOperate
        new_id = databaseOperate.create_post(
            db, 
            title=post.title, 
            content=post.content, 
            user_id=user.user_id,
            board_id=post.board_id,
            tags=post.tags
        )
        return {"status": "success", "post_id": new_id, "message": "Post created successfully"}
    except Exception as e:
        print(f"Error creating post: {e}")
        raise HTTPException(status_code=500, detail="Failed to create post")

@app.get("/api/posts")
def read_posts(
    limit: int = 20, 
    offset: int = 0, 
    db: Session = Depends(databaseOperate.get_db)
):
    posts = databaseOperate.get_all_posts(db, limit, offset)
    return {"status": "success", "data": posts}

@app.get("/api/posts/{post_id}")
def read_single_post(post_id: int, db: Session = Depends(databaseOperate.get_db)):
    post = databaseOperate.get_post_by_id(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"status": "success", "data": post}

# 假設你的 dist 資料夾路徑
DIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist") 

# ... 這裡放你的 API 路由 (@app.get("/api/...")) ...

# ==========================================
# 關鍵修正：掛載靜態檔案 (必須在 catchall 之前)
# ==========================================
# Vite 預設打包會將 JS/CSS 放在 dist/assets 資料夾下
assets_path = os.path.join(DIST_DIR, "assets")

if os.path.exists(assets_path):
    # 當瀏覽器請求 /assets/xxx.js 時，FastAPI 會直接從資料夾提供檔案
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

@app.get("/{catchall:path}")
async def serve_react(request: Request, catchall: str):
    # 1. 防止 API 誤入
    if catchall.startswith("api/"):
        raise HTTPException(status_code=404, detail="API Not Found")

    # 2. 嘗試尋找是否為根目錄的其他靜態檔 (如 favicon.ico, logo.png)
    # 如果請求的是存在於 dist 根目錄的檔案，直接回傳該檔案
    requested_file = os.path.join(DIST_DIR, catchall)
    if os.path.exists(requested_file) and os.path.isfile(requested_file):
        return FileResponse(requested_file)

    # 3. 如果都不是，回傳 index.html 讓 React Router 接手
    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    # 4. 開發階段的 Fallback
    return HTMLResponse(content=f"""
        <html>
            <body style="background:#13161A; color:#00bfff; display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif;">
                <div>
                    <h1>FastAPI Backend is Running</h1>
                    <p>React is running at <a href="http://127.0.0.1:5173" style="color:white;">127.0.0.1:5173</a></p>
                    <p>請執行 <code>npm run build</code> 將檔案放入 dist 資料夾，以此處訪問路徑：{catchall}</p>
                </div>
            </body>
        </html>
    """)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=9999, reload=True)