import bcrypt

class PasswordManager:
    @staticmethod
    def hash_password(password: str) -> str:
        """
        將明文密碼轉換為不可逆的雜湊值
        """
        # 1. 將字串轉換為 bytes (bcrypt 僅接受 bytes)
        pwd_bytes = password.encode('utf-8')
        
        # 2. 產生鹽值 (Salt) 並進行雜湊
        # gensalt() 預設的 rounds 是 12，這決定了運算強度
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(pwd_bytes, salt)
        
        # 3. 回傳解碼後的字串，以便存入資料庫 (PostgreSQL VARCHAR)
        return hashed_password.decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        驗證使用者輸入的密碼是否與資料庫中的雜湊值相符
        """
        try:
            return bcrypt.checkpw(
                plain_password.encode('utf-8'), 
                hashed_password.encode('utf-8')
            )
        except Exception:
            return False