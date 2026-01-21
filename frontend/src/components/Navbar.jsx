import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBell,
    faInbox,
    faMagnifyingGlass,
    faPlus,
    faGear,
} from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router-dom";

function Navbar({}) {
    return (
        <div className="navbar">
            <div className="title-name">
                <div className="title-txt">#　test</div>
                <div className="dash"></div>
                <div className="title-tip">Lorem Ipsum is simply dummy</div>
            </div>
            <div className="search">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                <input
                    type="text"
                    className="search-bar"
                    placeholder="Search..."
                />
            </div>
            <div className="nav-icon">
                <a className="notify-icon have-news">
                    <FontAwesomeIcon icon={faBell}></FontAwesomeIcon>
                </a>
                <NavLink to="/settings" className="set-icon">
                    <FontAwesomeIcon icon={faGear} />
                </NavLink>
                <div className="dash"></div>
                <NavLink to="/posts" className="new-post-btn">
                    <FontAwesomeIcon icon={faPlus} /> <span>New Post</span>
                </NavLink>
            </div>
        </div>
    );
}

export default Navbar;
