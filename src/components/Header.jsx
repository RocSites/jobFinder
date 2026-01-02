import './Header.css'
import { Link } from "react-router";

const Header = () => (
    <>
        <div class="header">
            <div class="header-inner">
                <span class="logo">JobFlow</span>
                <nav class="nav">
                    <Link to="/" class="active">home</Link>
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