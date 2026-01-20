import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Topic from "./components/Topic.jsx";
import Subtopic from "./components/Subtopic.jsx";
import Navbar from "./components/Navbar.jsx";
import hljs from "highlight.js";
import InSiteLoadPage from "./components/InSiteLoadPage.jsx";
window.hljs = hljs;


import "./homepage.css";

function Homepage({ user }) {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation(); // 取得當前路徑

  // 2. 監聽路徑變化 (生成計時)
  useEffect(() => {
    // 當路徑改變時 (例如從 / 切換到 /settings)
    setIsLoading(true);

    // 設定計時器：800毫秒後關閉 Loading
    // 這個時間可以自己調整，太短沒感覺，太長使用者會煩
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    // 清除計時器 (防止使用者快速切換導致記憶體洩漏)
    return () => clearTimeout(timer);
  }, [location.pathname]); // 只要 pathname 改變就觸發

  return (
    <section id="container">
      <Topic />
      <Subtopic user={user} />
      <div className="content">
        <Navbar />
        {/* 為了讓 Loading 只覆蓋在「功能區塊」，我們把它放在這 */}
        <div
          id="multi-functional-area"
          className="multi-functional-area"
          style={{ position: "relative" }}
        >
          {/* 3. 根據狀態顯示 Loading */}
          {isLoading && <InSiteLoadPage />}

          {/* 這裡有個小技巧：當在 Loading 時，可以隱藏內容，或者讓內容在底下偷偷渲染 */}
          {/* 如果想讓內容先隱藏，可以加 style={{ opacity: isLoading ? 0 : 1 }} */}
          <div
            style={{ opacity: isLoading ? 0 : 1, transition: "opacity 0.3s" }}
          >
            <Outlet />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Homepage;
