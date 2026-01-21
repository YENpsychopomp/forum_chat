import friend_icon from "../assets/temp_user.jpg";
import user_icon from "../assets/temp_user.jpg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import api from "../services/api";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal); // 這行必須在組件外部定義

function Subtopic({ user }) {
    const handleLogout = async (e) => {
        e.preventDefault();

        // 1. 先彈出確認視窗
        const result = await MySwal.fire({
            title: "確定要登出嗎？",
            text: "登出後需要重新登入才能使用完整功能。",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#00bfff", // 你的主題藍色
            cancelButtonColor: "#d33", // 紅色
            confirmButtonText: "是的，登出",
            cancelButtonText: "取消",
            background: "#13161a", // 跟隨你的深色主題
            color: "#fff",
        });

        // 2. 如果使用者點擊「取消」，則直接中斷，不執行 API
        if (!result.isConfirmed) return;

        // 3. 執行登出 API
        try {
            const response = await api.post("/logout", {}, {
                withCredentials: true,
            });

            if (response.data.status === "success") {
                await MySwal.fire({
                    icon: "success",
                    title: "已登出",
                    showConfirmButton: false,
                    timer: 1500,
                    background: "#13161a",
                    color: "#fff",
                });

                window.location.href = "/login";
            }
        } catch (error) {
            console.error("登出失敗:", error);
            MySwal.fire({
                icon: "error",
                title: "登出失敗",
                text: "連線異常，請稍後再試。",
                background: "#13161a",
                color: "#fff",
            });
        }
    };

    return (
        <div className="subtopic">
            <div className="topic_name">私人訊息</div>
            <div className="friends scrollbar-hide">
                <div className="friend">
                    <img src={friend_icon} alt="friend" />
                    <div className="name">Friend</div>
                </div>
            </div>
            <div className="user-info">
                <div className="user">
                    <img src={user_icon} alt="user" />
                    <div className="username">
                        <div className="user-page"></div>
                        <div className="name">{user.name}</div>
                        <span className="status">online</span>
                    </div>
                    <FontAwesomeIcon
                        icon={faRightFromBracket}
                        onClick={handleLogout}
                        className="logout-icon"
                    />
                </div>
            </div>
        </div>
    );
}

export default Subtopic;
