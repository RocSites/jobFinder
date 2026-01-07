import './Header.css'
import { Link } from "react-router-dom";

const Header = () => (
    <>
        <div className="header">
            <div className="header-inner">
                <Link to="/" className="logo active">JobFlow</Link>
                <nav className="nav">
                    <Link to="/leads">leads</Link>
                    <Link to="/pipeline">pipeline</Link>
                    {/* <Link to="/">interviews</Link> */}
                    {/* <Link to="/">messages</Link> */}
                </nav>
                <div className="spacer"></div>
                <span className="user-info">doug_k | logout</span>
            </div>
        </div>
    </>
)

export default Header;