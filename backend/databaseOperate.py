from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import OperationalError
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.dialects.postgresql import JSONB, insert
from datetime import datetime, timedelta, timezone
import json

VERIFY_CODE_EXPIRE_SEC = 600

SQLALCHEMY_DATABASE_URL = "postgresql://chichi:cm8e9bct@localhost:9957/chat_forum"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        # 1. 主動測試連線 (Ping)
        # 在把 db 交給路由之前，先執行一個超輕量的查詢。
        # 如果資料庫沒開，這裡就會直接觸發 OperationalError。
        db.execute(text("SELECT 1"))
        
        yield db
    except OperationalError as e:
        # 2. 捕捉連線失敗錯誤
        # e.orig 是原始的 psycopg2 錯誤訊息 (例如 "Connection refused...")
        print(f"❌ 資料庫連線失敗 (Database Connection Failed): {e.orig}")
        
        # 3. 拋出 503 錯誤給前端，而不是讓伺服器崩潰顯示 500
        raise HTTPException(status_code=503, detail="資料庫連線失敗，請稍後再試。")
        
    except Exception as e:
        # 其他非連線的錯誤 (如 SQL 語法錯) 還是照常處理
        db.rollback()
        raise e
    finally:
        db.close()

def get_user_profile(db: Session, user_id: str):
    """
    獲取使用者設定與權重
    """
    sql = text("""
        SELECT avatar_url, preferences, topic_weights 
        FROM user_profiles 
        WHERE user_id = :uid
    """)
    return db.execute(sql, {"uid": user_id}).fetchone()

def get_user_by_session_dynamic(db: Session, token: str):
    """
    透過 Session Token 查詢使用者資訊與建立時間
    """
    sql = text("""
        SELECT u.username, u.user_id, s.created_at 
        FROM user_sessions s
        JOIN users u ON s.user_id = u.user_id
        WHERE s.session_token = :token
    """)
    
    return db.execute(sql, {"token": token}).fetchone()

def get_user_by_username(db: Session, username: str):
    """
    透過使用者名稱查詢使用者資訊
    """
    sql = text("SELECT user_id, username, email, password_hash FROM users WHERE username = :name")
    return db.execute(sql, {"name": username}).fetchone()

def get_user_by_email(db: Session, email: str):
    sql = text("SELECT user_id FROM users WHERE email = :email")
    return db.execute(sql, {"email": email}).fetchone()

def create_user_session(db: Session, user_id: int, token: str):
    """
    建立新的 Session 紀錄
    """
    sql = text(
        "INSERT INTO user_sessions (user_id, session_token) "
        "VALUES (:u_id, :token)"
    )
    try:
        db.execute(sql, {
            "u_id": user_id, 
            "token": token, 
        })
        db.commit() # 寫入資料庫
    except Exception as e:
        db.rollback()
        raise e

def delete_user_session(db: Session, token: str):
    """
    刪除指定的 Session
    """
    sql = text("DELETE FROM user_sessions WHERE session_token = :token")
    try:
        db.execute(sql, {"token": token})
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    
def create_user(db: Session, username: str, hashed_pwd: str, email: str = None) -> str:
    """
    建立新使用者並回傳 UUID
    """
    sql = text(
        "INSERT INTO users (username, password_hash, email) "
        "VALUES (:name, :pwd, :email) "
        "RETURNING user_id"
    )
    try:
        result = db.execute(sql, {
            "name": username, 
            "pwd": hashed_pwd,
            "email": email
        })
        db.commit()
        # 取得剛產生的 UUID 並轉為字串
        return str(result.fetchone().user_id)
    except Exception as e:
        db.rollback()
        raise e

def update_user_profile(db: Session, user_id: str, avatar: str = None, prefs: dict = None, weights: dict = None):
    """
    更新使用者 Profile (支援部分更新)
    """
    # 建構要更新的資料字典
    update_data = {}
    if avatar is not None:
        update_data['avatar_url'] = avatar
    if prefs is not None:
        update_data['preferences'] = prefs
    if weights is not None:
        update_data['topic_weights'] = weights
    
    # 使用 PostgreSQL 的 UPSERT 語法
    stmt = insert(text("user_profiles")).values(
        user_id=user_id,
        **update_data
    ).on_conflict_do_update(
        index_elements=['user_id'], # 如果 user_id 衝突 (代表已存在)
        set_=update_data            # 就執行更新
    )
    
    try:
        db.execute(stmt)
        db.commit()
    except Exception as e:
        db.rollback()
        raise e

def save_verification_code(db: Session, email: str, code: str):
    """
    使用 PostgreSQL UPSERT (ON CONFLICT) 儲存驗證碼。
    優點：原子操作、效能高、無 Race Condition。
    """
    expires = datetime.now(timezone.utc) + timedelta(seconds=VERIFY_CODE_EXPIRE_SEC)

    # 這裡使用 :變數名稱 來防止 SQL Injection
    sql = text("""
        INSERT INTO email_verifications (email, code, expires_at, created_at)
        VALUES (:email, :code, :exp, CURRENT_TIMESTAMP)
        ON CONFLICT (email) 
        DO UPDATE SET 
            code = EXCLUDED.code,
            expires_at = EXCLUDED.expires_at,
            created_at = CURRENT_TIMESTAMP;
    """)

    try:
        db.execute(sql, {"email": email, "code": code, "exp": expires})
        db.commit() # 記得 Commit 確保寫入
    except Exception as e:
        db.rollback() # 發生錯誤時回滾，保持資料一致性
        # 在生產環境建議使用 logger.error(f"DB Error: {e}")
        raise e

def verify_code(db: Session, email: str, code: str) -> bool:
    """
    檢查驗證碼是否正確且未過期 (只讀取，不刪除)
    """
    sql = text("""
        SELECT * FROM email_verifications 
        WHERE email = :email AND code = :code AND expires_at > CURRENT_TIMESTAMP
    """)
    result = db.execute(sql, {"email": email, "code": code}).fetchone()
    return True if result else False

def delete_verification_code(db: Session, email: str):
    """
    註冊成功後，手動刪除驗證碼
    """
    sql = text("DELETE FROM email_verifications WHERE email = :email")
    try:
        db.execute(sql, {"email": email})
        db.commit()
    except Exception:
        db.rollback()

def update_last_login(db: Session, user_id: int):
    """
    更新使用者的最後登入時間
    """
    sql = text(
        "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = :u_id"
    )
    try:
        db.execute(sql, {"u_id": user_id})
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    
def create_post(db: Session, title: str, content: str, user_id: int, board_id: int, tags: list):
    """
    建立新文章 (包含 board_id 與 tags)
    """
    sql = text("""
        INSERT INTO posts (title, content, user_id, board_id, tags, created_at, updated_at)
        VALUES (:title, :content, :uid, :bid, :tags, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id
    """)
    try:
        result = db.execute(sql, {
            "title": title, 
            "content": content, 
            "uid": user_id,
            "bid": board_id,
            # 關鍵：PostgreSQL 的 JSONB 需要接收 JSON 字串，所以用 json.dumps 轉一下
            "tags": json.dumps(tags) 
        })
        db.commit()
        return result.fetchone().id
    except Exception as e:
        db.rollback()
        raise e

def get_all_posts(db: Session, limit: int = 20, offset: int = 0):
    """
    抓取文章 (新增 board_id, tags)
    """
    sql = text("""
        SELECT p.id, p.title, p.content, p.created_at, p.board_id, p.tags, 
               u.username, u.user_id
        FROM posts p
        JOIN users u ON p.user_id = u.user_id
        ORDER BY p.created_at DESC
        LIMIT :limit OFFSET :offset
    """)
    result = db.execute(sql, {"limit": limit, "offset": offset}).fetchall()
    
    posts = []
    for row in result:
        posts.append({
            "id": row.id,
            "title": row.title,
            "content": row.content,
            "created_at": row.created_at,
            "board_id": row.board_id, # 回傳看板 ID
            "tags": row.tags,         # SQLAlchemy 會自動將 JSONB 轉回 Python List
            "author": {
                "name": row.username,
                "id": row.user_id
            }
        })
    return posts

def get_post_by_id(db: Session, post_id: int):
    """
    抓取單一文章 (新增 board_id, tags)
    """
    sql = text("""
        SELECT p.id, p.title, p.content, p.created_at, p.board_id, p.tags,
               u.username, u.user_id
        FROM posts p
        JOIN users u ON p.user_id = u.user_id
        WHERE p.id = :pid
    """)
    row = db.execute(sql, {"pid": post_id}).fetchone()
    
    if row:
        return {
            "id": row.id,
            "title": row.title,
            "content": row.content,
            "created_at": row.created_at,
            "board_id": row.board_id,
            "tags": row.tags, 
            "author": {
                "name": row.username,
                "id": row.user_id
            }
        }
    return None