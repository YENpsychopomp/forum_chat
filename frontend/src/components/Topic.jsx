import logo from "../assets/logo.svg";
import top from "../assets/top.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router-dom";

function Topic() {
    return (
        <div className="topic">
            <div className="topic-icons">
                <NavLink to="/">
                    <img className="logo" src={logo} alt="logo" />
                </NavLink>
                <div className="dash"></div>
                <NavLink to="/article/-1">
                    <img
                        className="topic-icon"
                        src={top}
                        alt="top"
                    />
                </NavLink>
                <NavLink to="nothing">
                    <img
                        className="topic-icon"
                        src={logo}
                        alt="{topic_name}"
                    />
                </NavLink>
                <NavLink to="nothing">
                    <img
                        className="topic-icon"
                        src={logo}
                        alt="{topic_name}"
                    />
                </NavLink>
            </div>
            <div className="add-icon">
                <FontAwesomeIcon icon={faPlus} />
            </div>
        </div>
    );
}

export default Topic;
