import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // 配合你的 Vite Proxy
    withCredentials: true, // 關鍵：讓 Axios 每次都帶上 Cookie
});

// 攔截器範例：如果後端噴 401，代表 Session 過期
api.interceptors.response.use(
    response => response,
    error => {
        const { config, response } = error;

        // 1. 判斷是否為 401 錯誤
        if (response && response.status === 401) {
            
            // 2. 判斷 URL 是否為 check-session
            // config.url 通常會是 "/check-session"
            if (config.url.includes('/check-session')) {
                console.log('這是初始檢查，不執行強制登出邏輯');
            } else {
                // 如果是其他 API (例如發文、刪除) 噴出 401，才強制跳轉
                console.warn('其他 API 授權失敗，準備導向登入頁');
                // window.location.href = '/'; 
            }
        }
        return Promise.reject(error);
    }
);

export default api;