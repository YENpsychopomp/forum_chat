import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // 1. 引入你的 api instance
import './Article.css';

function Article( { boardIds } ) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const boardMap = {
        1: "綜合討論",
        2: "技術分享",
        3: "閒聊",
        4: "公告"
    };

    // 抓取文章列表
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                // 2. 改用 api.get
                // Axios 會自動檢查狀態碼，非 2xx 會直接跳到 catch
                // 可以透過 params 物件傳遞參數，比手寫字串安全
                const res = await api.get('/posts', { 
                    params: { limit: 20, offset: 0 } 
                });

                // 3. 資料結構處理
                // res.data 是後端回傳的完整 JSON: { status: "success", data: [...] }
                // 所以文章列表在 res.data.data 裡面
                setPosts(res.data.data);
            } catch (err) {
                console.error("Fetch posts failed:", err);
                // 4. Axios 的錯誤訊息通常在 err.response.data.detail
                setError(err.response?.data?.detail || "資料獲取失敗");
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    // 格式化日期 helper
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    if (loading) return <div className="loading-container">載入中...</div>;
    if (error) return <div className="error-container">錯誤: {error}</div>;

    return (
        <div className="article-page">
            <h1 className="page-title">最新文章</h1>
            
            <div className="article-list">
                {posts.length === 0 ? (
                    <div className="no-posts">目前沒有任何文章，快去發布第一篇吧！</div>
                ) : (
                    posts.map((post) => (
                        <div key={post.id} className="article-card" onClick={() => navigate(`/posts/${post.id}`)}>
                            {/* 卡片頭部：看板與日期 */}
                            <div className="card-header">
                                <span className={`badge board-badge board-${post.board_id}`}>
                                    {boardMap[post.board_id] || "未分類"}
                                </span>
                                <span className="post-date">{formatDate(post.created_at)}</span>
                            </div>

                            {/* 標題 */}
                            <h2 className="card-title">{post.title}</h2>

                            {/* 作者 */}
                            <div className="card-author">
                                <span className="author-name">@{post.author.name}</span>
                            </div>

                            {/* 內容預覽 (HTML) */}
                            {/* 限制高度，只顯示一部分 */}
                            <div 
                                className="card-content-preview ql-snow"
                            >
                                <div 
                                    className="ql-editor"
                                    dangerouslySetInnerHTML={{ __html: post.content }} 
                                />
                            </div>

                            {/* 底部：標籤 */}
                            <div className="card-footer">
                                <div className="tags-container">
                                    {post.tags && post.tags.map((tag, index) => (
                                        <span key={index} className="post-tag">{tag}</span>
                                    ))}
                                </div>
                                <span className="read-more">閱讀全文 &rarr;</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Article;