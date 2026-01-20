import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os


# 建議將這些設定放入環境變數 (.env)
SMTP_SERVER = "smtp.gmail.com" # 或你的郵件伺服器
SMTP_PORT = 587
SENDER_EMAIL = "C113118207@nkust.edu.tw"
SENDER_PASSWORD = "qlfk enex ozsx gnot" # 注意：Google 需要去設定申請「應用程式密碼」

def send_verification_email(to_email: str, code: str):
    """
    發送驗證碼郵件的同步函式
    """
    subject = "【Chat Forum】您的註冊驗證碼"
    body = f"""
    <html>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #333333; margin: 0;">歡迎加入 Chat Forum</h2>
                </div>
                <div style="color: #666666; font-size: 16px; line-height: 1.5; text-align: center;">
                    <p style="margin-bottom: 20px;">親愛的用戶您好，</p>
                    <p>感謝您註冊 Chat Forum。為了確保您的帳戶安全，請使用以下驗證碼完成註冊程序：</p>
                    
                    <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 20px; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff; display: block;">{code}</span>
                    </div>
                    
                    <p style="font-size: 14px; color: #999999;">此驗證碼將在 10 分鐘後失效，請勿將其告訴他人。</p>
                    <p style="font-size: 14px; color: #999999; margin-top: 30px;">如果您沒有請求此驗證碼，請忽略此郵件。</p>
                </div>
                <div style="border-top: 1px solid #eeeeee; margin-top: 40px; padding-top: 20px; text-align: center; font-size: 12px; color: #aaaaaa;">
                    &copy; 2024 Chat Forum. All rights reserved.
                </div>
            </div>
        </body>
    </html>
    """

    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'html'))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        # 生產環境要寫入 Log
        print(f"Email sent to {to_email}")
        return {"status": "success", "message": "Email sent!"}
    except Exception as e:
        print(f"Email sending failed: {e}")
        return {"status": "error", "message": str(e)}