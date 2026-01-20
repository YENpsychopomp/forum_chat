// 記得引入 useMemo
import React, { useMemo, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

// 1. 引入 highlight.js 與樣式
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";

import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "./PostPage.css";
import api from "../services/api";

const MySwal = withReactContent(Swal);

// 2. 設定 highlight.js 到全域變數 (這行保持在 Component 外部)
window.hljs = hljs;

function PostPage() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [selectedBoard, setSelectedBoard] = useState("");
    const [tags, setTags] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const boards = [
        { id: 1, name: "綜合討論 (General)" },
        { id: 2, name: "技術分享 (Tech)" },
        { id: 3, name: "閒聊 (Chat)" },
        { id: 4, name: "公告 (Announcements)" },
    ];

    // --- 關鍵修正：使用 useMemo 包裹 modules ---
    // 這樣可以防止 React 在重新渲染時(例如打字時) 重建 modules 物件，導致 Quill 報錯
    const modules = useMemo(() => ({
        syntax: {
            // 使用函數方式傳入 highlight 邏輯，這是最穩定的寫法
            highlight: (text) => hljs.highlightAuto(text).value,
        },
        toolbar: [
            [{ "header": [1, 2, false] }],
            ["bold", "italic", "underline", "strike", "blockquote"],
            ["code-block"], // 程式碼區塊
            [{ "list": "ordered" }, { "list": "bullet" }],
            ["link", "image", "video"],
            ["clean"],
        ],
    }), []); // 空陣列代表這個設定永遠不會變

    const showToast = (icon, title) => {
        MySwal.fire({
            icon: icon,
            title: title,
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: "#1e2228",
            color: "#fff",
        });
    };

    const handlePublish = async (e) => {
        e.preventDefault();

        // 1. 基本欄位檢查
        if (!selectedBoard) {
            showToast("warning", "請選擇一個發文看板！");
            return;
        }
        if (!title.trim() || !content.trim()) {
            showToast("warning", "標題與內容不能為空！");
            return;
        }

        setIsSubmitting(true);

        try {
            // --- 標籤處理邏輯 (保持不變) ---
            let rawTags = tags.split(/\s+/).filter((tag) => tag.trim() !== "");

            if (rawTags.length > 10) {
                showToast("warning", "標籤數量不能超過 10 個！");
                setIsSubmitting(false); // 記得在 return 前重置 loading
                return;
            }

            const validTags = [];
            for (let tag of rawTags) {
                if (!tag.startsWith("#")) tag = "#" + tag;

                if (tag.length > 20) {
                    showToast("warning", `標籤 "${tag}" 太長了 (最多 20 字)`);
                    setIsSubmitting(false);
                    return;
                }

                if (tag === "#") continue;

                if (!/^#[a-zA-Z0-9_\u4e00-\u9fa5\-]+$/.test(tag)) {
                    showToast(
                        "warning",
                        `標籤 "${tag}" 含有無效字元 (僅限中英數、底線、減號)`,
                    );
                    setIsSubmitting(false);
                    return;
                }
                validTags.push(tag);
            }
            const uniqueTags = [...new Set(validTags)];

            const response = await api.post("/posts", {
                title: title,
                content: content,
                board_id: selectedBoard,
                tags: uniqueTags,
            });
            // 3. 成功處理
            await MySwal.fire({
                title: "發布成功！",
                text: "你的文章已經順利送出。",
                icon: "success",
                confirmButtonColor: "#00bfff",
                background: "#13161a",
                color: "#fff",
            });

            navigate("/");
        } catch (error) {
            console.error("Error:", error);

            // 4. 錯誤處理優化：抓取後端回傳的具體錯誤訊息
            // FastAPI 預設錯誤結構通常在 error.response.data.detail
            const errorMsg = error.response?.data?.detail ||
                "伺服器發生錯誤，請稍後再試。";

            MySwal.fire({
                title: "發布失敗",
                text: errorMsg,
                icon: "error",
                confirmButtonColor: "#d33",
                background: "#13161a",
                color: "#fff",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="post-page-container">
            <div className="post-editor-wrapper">
                <h2>New Post</h2>
                <form onSubmit={handlePublish}>
                    <div className="post-meta-group">
                        <select
                            className="post-select-board"
                            value={selectedBoard}
                            onChange={(e) => setSelectedBoard(e.target.value)}
                        >
                            <option value="" disabled>選擇看板...</option>
                            {boards.map((board) => (
                                <option key={board.id} value={board.id}>
                                    {board.name}
                                </option>
                            ))}
                        </select>

                        <input
                            type="text"
                            className="post-title-input"
                            placeholder="請輸入標題..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <input
                        type="text"
                        className="post-tags-input"
                        placeholder="加入標籤 (例如: #React #日記，以空白分隔，如果標籤含有空白請用底線代替)..."
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                    />

                    <div className="editor-container">
                        <ReactQuill
                            theme="snow"
                            value={content}
                            onChange={setContent}
                            modules={modules} // 傳入 memoized 的 modules
                            placeholder="分享你的想法... (支援圖片、影片連結、程式碼區塊等)"
                        />
                    </div>

                    <div className="post-actions">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={() => navigate("/")}
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="publish-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "發布中..." : "發布文章"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PostPage;
