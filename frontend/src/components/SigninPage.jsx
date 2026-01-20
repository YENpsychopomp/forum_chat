import { useEffect, useState } from "react";
import logo from "../assets/logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";
import {
    faArrowLeft,
    faCheckCircle,
    faEnvelope,
    faKey,
    faLock,
    faPaperPlane,
    faUser,
    faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import "./LogSigninPage.css";

function SigninPage() {
    // 1. 定義狀態：step 控制目前步驟
    const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: Profile
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    // 2. 表單資料
    const [formData, setFormData] = useState({
        email: "",
        code: "",
        username: "",
        password: "",
        confirmPassword: "",
    });

    useEffect(() => {
        if (step === 2 && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [step, countdown]);

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- 步驟 1: 發送驗證碼 ---
    const handleSendCode = async (e) => {
        e.preventDefault();
        if (!formData.email) return Swal.fire("請輸入 Email");

        setIsLoading(true);
        try {
            // 呼叫後端發送驗證碼 API
            await api.post("/send-code", { email: formData.email });

            Swal.fire({
                icon: "success",
                title: "驗證碼已發送",
                text: "請檢查您的信箱 (包含垃圾郵件)",
                timer: 2000,
                showConfirmButton: false,
                background: "#1A1E23",
                color: "#FFFFFF",
            });
            setStep(2); // 前進到下一步
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "發送失敗",
                text: err.response?.data?.detail || "請稍後再試",
                background: "#1A1E23",
                color: "#FFFFFF",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // --- 步驟 2: 檢查驗證碼 ---
    const handleVerifyCode = async (e) => {
        e.preventDefault();
        if (!formData.code) return Swal.fire("請輸入驗證碼");

        setIsLoading(true);
        try {
            // 呼叫後端檢查 API (不刪除 Code，只確認是否正確)
            await api.post("/check-code", {
                email: formData.email,
                code: formData.code,
            });

            // 驗證成功，進入最後一步
            setStep(3);
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "驗證失敗",
                text: err.response?.data?.detail || "驗證碼錯誤",
                background: "#1A1E23",
                color: "#FFFFFF",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // --- 步驟 3: 最終註冊 ---
    const handleRegister = async (e) => {
        e.preventDefault();
        const { username, email, password, code, confirmPassword } = formData;
        const specialcharacters = "$#@!%*?&";

        if (password !== confirmPassword) {
            return Swal.fire({
                icon: "error",
                title: "錯誤",
                text: "兩次密碼輸入不一致",
                background: "#1A1E23",
                color: "#FFFFFF",
            });
        }

        if (password.length < 8 || !specialcharacters.split("").some(char => password.includes(char)) || /\s/.test(password)) {
            return Swal.fire({
                icon: "error",
                title: "錯誤",
                text: "密碼長度至少8字元，且必須包含至少一個特殊字元 ($#@!%*?&)，且不能包含空白",
                background: "#1A1E23",
                color: "#FFFFFF",
            });
        }

        setIsLoading(true);
        try {
            // 最終註冊：整包送出去
            const payload = { username, email, password, code };
            await api.post("/register", payload);

            Swal.fire({
                icon: "success",
                title: "註冊成功！",
                text: "正在為您登入...",
                timer: 2000,
                showConfirmButton: false,
                background: "#1A1E23",
                color: "#FFFFFF",
            }).then(() => {
                navigate("/login");
            });
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "註冊失敗",
                text: err.response?.data?.detail || "請檢查網路連線",
                background: "#1A1E23",
                color: "#FFFFFF",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <img src={logo} alt="logo" className="auth-logo" />
                    <h2>
                        {step === 1 && "建立新帳號"}
                        {step === 2 && "輸入驗證碼"}
                        {step === 3 && "設定個人資料"}
                    </h2>
                    <p>
                        {step === 1 && "首先，我們需要驗證您的 Email"}
                        {step === 2 && `驗證碼已寄送至 ${formData.email}`}
                        {step === 3 && "最後一步，設定您的帳號密碼"}
                    </p>
                </div>

                {/* 根據 step 渲染不同的 Form 內容，但共用同一個外框 */}

                {/* --- Step 1: 輸入 Email --- */}
                {step === 1 && (
                    <form onSubmit={handleSendCode}>
                        <div className="input-group">
                            <FontAwesomeIcon
                                icon={faEnvelope}
                                className="input-icon"
                            />
                            <input
                                type="email"
                                name="email"
                                placeholder="請輸入電子郵件"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            className="auth-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? "發送中..." : (
                                <>
                                    發送驗證碼{" "}
                                    <FontAwesomeIcon icon={faPaperPlane} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* --- Step 2: 輸入驗證碼 --- */}
                {step === 2 && (
                    <form onSubmit={handleVerifyCode}>
                        <div className="input-group">
                            <FontAwesomeIcon
                                icon={faKey}
                                className="input-icon"
                            />
                            <input
                                type="text"
                                name="code"
                                placeholder="6 位數驗證碼"
                                value={formData.code}
                                onChange={handleChange}
                                required
                                maxLength="6"
                                autoFocus
                            />
                        </div>
                        <div
                            style={{ marginTop: "10px", marginBottom: "10px" }}
                        >
                            {countdown > 0
                                ? (
                                    <span style={{ color: "#888" }}>
                                        {countdown} 秒後可重新發送
                                    </span>
                                )
                                : (
                                    <button
                                        type="button" // 避免 submit form
                                        onClick={handleSendCode} // 重新呼叫 /api/send-code
                                        className="resend-btn"
                                    >
                                        <span>
                                            沒收到？重新發送
                                        </span>
                                    </button>
                                )}
                        </div>
                        <button
                            type="submit"
                            className="auth-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? "驗證中..." : (
                                <>
                                    驗證{" "}
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                </>
                            )}
                        </button>
                        <div style={{ textAlign: "center", marginTop: "10px" }}>
                            <small
                                style={{
                                    color: "#888",
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                }}
                                onClick={() => setStep(1)}
                            >
                                修改 Email?
                            </small>
                        </div>
                    </form>
                )}

                {/* --- Step 3: 設定帳密 --- */}
                {step === 3 && (
                    <form onSubmit={handleRegister}>
                        <div className="input-group">
                            <FontAwesomeIcon
                                icon={faUser}
                                className="input-icon"
                            />
                            <input
                                type="text"
                                name="username"
                                placeholder="使用者名稱"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="input-group">
                            <FontAwesomeIcon
                                icon={faLock}
                                className="input-icon"
                            />
                            <input
                                type="password"
                                name="password"
                                placeholder="密碼"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <FontAwesomeIcon
                                icon={faLock}
                                className="input-icon"
                            />
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="確認密碼"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="auth-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? "註冊中..." : (
                                <>
                                    完成註冊{" "}
                                    <FontAwesomeIcon icon={faUserPlus} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <Link to="/login" className="back-btn">
                        <FontAwesomeIcon icon={faArrowLeft} /> 返回登入
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default SigninPage;
