import './Header.css'
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const Header = () => {
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved === 'true';
    });

    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    return (
        <>
            <div className="header">
                <div className="header-inner">
                    <Link to="/" className="logo active">GigFrog</Link>
                    <nav className="nav">
                        <Link to="/pipeline">pipeline</Link>
                        <Link to="/leads">leads</Link>
                        <Link to="/referrals">referrals</Link>
                        {/* <Link to="/">interviews</Link> */}
                        {/* <Link to="/">messages</Link> */}
                    </nav>
                    <div className="spacer"></div>
                    <button
                        className="dark-mode-toggle"
                        onClick={toggleDarkMode}
                        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                    <span className="user-info">doug_k | logout</span>
                </div>
            </div>
        </>
    );
};

export default Header;