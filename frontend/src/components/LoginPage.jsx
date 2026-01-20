import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // 引入 Link 和 useNavigate
import Swal from "sweetalert2";
import api from "../services/api.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faLock,
    faRightToBracket,
    faUser,
} from "@fortawesome/free-solid-svg-icons";
import logo from "../assets/logo.png"; // 請確認路徑
import "./LogSigninPage.css"; // 引入 CSS

function LoginPage({ setUser }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isRedirecting, setIsRedirecting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        Swal.showLoading();

        api.post("/login", { name: username, password: password })
            .then((res) => {
                Swal.close();

                // 1. 顯示成功訊息
                Swal.fire({
                    icon: "success",
                    title: "登入成功",
                    text: `歡迎回來, ${res.data.name}!`,
                    timer: 1000, // 稍微縮短時間，讓流程更流暢
                    showConfirmButton: false,
                    background: "#1A1E23",
                    color: "#FFFFFF",
                }).then(() => {
                    // 2. SW2 動畫結束後，啟動 Loading 畫面
                    setIsRedirecting(true);

                    // 3. 更新 User 狀態並延遲跳轉 (例如延遲 1.2 秒)
                    setTimeout(() => {
                        setUser(res.data);
                        navigate("/");
                    }, 1200);
                });
            })
            .catch((err) => {
                console.error("Login failed:", err);
                Swal.fire({
                    icon: "error",
                    title: "登入失敗",
                    text: err.response?.data?.detail || "帳號或密碼錯誤",
                    background: "#1A1E23",
                    color: "#FFFFFF",
                    confirmButtonColor: "#00bfff",
                });
            });
    };

    if (isRedirecting) {
        return (
            <div className="loading-screen">
                <div className="loader-content">
                    <img
                        src={logo}
                        alt="Loading"
                        className="loading-logo-img"
                    />
                    <div className="loader-bar">
                        <div className="loader-progress"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <img src={logo} alt="logo" className="login-logo" />
                    <h2>歡迎回來</h2>
                    <p>請登入以繼續討論</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* ... Input 內容保持不變 ... */}
                    <div className="input-group">
                        <FontAwesomeIcon icon={faUser} className="input-icon" />
                        <input
                            type="text"
                            placeholder="使用者名稱"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <FontAwesomeIcon icon={faLock} className="input-icon" />
                        <input
                            type="password"
                            placeholder="密碼"
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="login-btn">
                        登入 <FontAwesomeIcon icon={faRightToBracket} />
                    </button>
                </form>

                <div className="login-footer">
                    <span>還沒有帳號？</span>
                    {/* 這裡使用 Link 跳轉到註冊頁 */}
                    <Link
                        to="/signup"
                        style={{ color: "#00bfff", marginLeft: "5px" }}
                    >
                        立即註冊
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
