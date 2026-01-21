import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import api from "./services/api.js";
import logo from "./assets/logo.png"; // 請確認路徑

// 引入頁面組件
import Homepage from "./homepage.jsx";
import LoginPage from "./components/Loginpage.jsx";
import SigninPage from "./components/SigninPage.jsx"; // 假設你有這個
import SettingsPage from "./components/SettingsPage.jsx";
import MessagePage from "./components/MessagePage.jsx";
import PostPage from "./components/PostPage.jsx";
import InitPage from "./components/InitPage.jsx";
import ArticlePage from "./components/ArticlePage.jsx";

import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 1. 全域 Session 檢查 (只在 App 啟動時做一次)
  useEffect(() => {
    api.get("/check-session")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  // 2. 驗證中：顯示全螢幕載入
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loader-content">
          <img src={logo} alt="Loading" className="loading-logo-img" />
          <div className="loader-bar">
            <div className="loader-progress"></div>
          </div>
        </div>
      </div>
    );
  }

  // 3. 定義路由表
  return (
    <Routes>
      {/* --- 父路由: Homepage --- */}
      <Route
        path="/"
        element={user
          ? <Homepage user={user} />
          : <Navigate to="/login" replace />}
      >
        {/* --- 子路由們 (會顯示在 Homepage 的 Outlet 位置) --- */}

        {/* index 代表預設顯示的頁面 (網址是 / 時) */}
        <Route index element={<ArticlePage user={user} />} />

        {/* 網址是 /settings 時顯示 */}
        <Route path="settings" element={<SettingsPage user={user} />} />
        <Route path="messages" element={<MessagePage />} />
        <Route path="posts" element={<PostPage user={user} />} />
        <Route path="article" element={<ArticlePage user={user} />} />
      </Route>

      {/* --- 登入註冊頁保持不變 --- */}
      <Route
        path="/login"
        element={!user
          ? <LoginPage setUser={setUser} />
          : <Navigate to="/" replace />}
      />
      <Route
        path="/signup"
        element={!user ? <SigninPage /> : <Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default App;
