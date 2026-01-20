import friend_icon from "../assets/temp_user.jpg";
import user_icon from "../assets/temp_user.jpg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightToBracket } from "@fortawesome/free-solid-svg-icons";

function Subtopic({ user }) {
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
                        <div className="name">{ user.name }</div>
                        <span className="status">online</span>
                    </div>
                    <FontAwesomeIcon icon={faRightToBracket} />
                </div>
            </div>
        </div>
    );
}

export default Subtopic;
