import './Header.css'
import { Link } from "react-router";

const Header = () => (
    <>
        <div class="header">
            <div class="header-inner">
                <Link to="/" class="logo active">JobFlow</Link>
                <nav class="nav">
                    <Link to="/leads">leads</Link>
                    <Link to="/">pipeline</Link>
                    <Link to="/">interviews</Link>
                    <Link to="/">messages</Link>
                </nav>
                <div class="spacer"></div>
                <span class="user-info">john_doe | logout</span>
            </div>
        </div>
    </>
)

export default Header;