import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "./PostPage.css";
import api from "../services/api"; // 確認你的 API路徑正確

// --- Highlight.js 設定 ---
import hljs from "highlight.js/lib/core";
import "highlight.js/styles/atom-one-dark.css";

// 引入語言包
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import cpp from "highlight.js/lib/languages/cpp";
import java from "highlight.js/lib/languages/java";
import go from "highlight.js/lib/languages/go";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml"; // XML 包含 HTML
import yaml from "highlight.js/lib/languages/yaml";
import php from "highlight.js/lib/languages/php";

// 註冊語言
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("java", java);
hljs.registerLanguage("python", python);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("json", json);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("go", go);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("php", php);
// 關鍵：掛載到 window
window.hljs = hljs;
const MySwal = withReactContent(Swal);

import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

function PostPage() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [selectedBoard, setSelectedBoard] = useState(""); // ✅ 這行已經有了，很好
    const [tags, setTags] = useState("");

    // 🔥🔥🔥 修正點：補上遺失的 isSubmitting 狀態 🔥🔥🔥
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();

    const boards = [
        { id: 1, name: "綜合討論 (General)" },
        { id: 2, name: "技術分享 (Tech)" },
        { id: 3, name: "閒聊 (Chat)" },
        { id: 4, name: "公告 (Announcements)" },
    ];

    // --- modules 設定 ---
    const modules = useMemo(() => ({
        syntax: {
            hljs, // 直接把實例傳進去，這比依賴 window 更穩定
            languages: [
                { key: "plain", label: "txt" },
                { key: "javascript", label: "JavaScript" },
                { key: "typescript", label: "TypeScript" },
                { key: "python", label: "Python" },
                { key: "java", label: "Java" },
                { key: "json", label: "JSON" },
                { key: "sql", label: "SQL" },
                { key: "cpp", label: "C++" },
                { key: "bash", label: "Bash" },
                { key: "css", label: "CSS" },
                { key: "html", label: "HTML" },
                { key: "yaml", label: "YAML" },
                { key: "php", label: "PHP" },
            ],
        },
        toolbar: [
            [{ "header": [1, 2, false] }],
            ["bold", "italic", "underline", "strike", "blockquote"],
            ["code-block"],
            [{ "list": "ordered" }, { "list": "bullet" }],
            ["link", "image", "video"],
            ["clean"],
        ],
    }), []);

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

        setIsSubmitting(true); // ✅ 現在這裡不會報錯了

        try {
            // --- 標籤處理邏輯 ---
            let rawTags = tags.split(/\s+/).filter((tag) => tag.trim() !== "");

            if (rawTags.length > 10) {
                showToast("warning", "標籤數量不能超過 10 個！");
                setIsSubmitting(false);
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
                    showToast("warning", `標籤 "${tag}" 含有無效字元`);
                    setIsSubmitting(false);
                    return;
                }
                validTags.push(tag);
            }
            const uniqueTags = [...new Set(validTags)];

            const response = await api.post("/posts", {
                title: title,
                content: content,
                board_id: selectedBoard, // 確保後端接收欄位是 board_id
                tags: uniqueTags,
            });

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
            setIsSubmitting(false); // ✅ 確保無論成功失敗都會解鎖按鈕
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
                        placeholder="加入標籤 (例如: #React #日記)..."
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                    />

                    <div className="editor-container">
                        <ReactQuill
                            theme="snow"
                            value={content}
                            onChange={setContent}
                            modules={modules}
                            placeholder="分享你的想法... (支援程式碼區塊)"
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
                            disabled={isSubmitting} // ✅ 綁定 loading 狀態
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
