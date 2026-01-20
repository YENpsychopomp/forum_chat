import "./InSiteLoadPage.css"; // 引入樣式

function InSiteLoadPage() {
    return (
        <div className="insite-loader-container">
            <div className="insite-loader-content">
                <div className="spinner-ring"></div>
                <div className="loading-text">SYSTEM LOADING</div>
            </div>
        </div>
    );
}

export default InSiteLoadPage;
