import './Header.css'
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const Header = () => {
    const { user, signOut, isAdmin } = useAuth();
    const navigate = useNavigate();
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

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    // Get display name from email (part before @)
    const displayName = user?.email?.split('@')[0] || 'user';

    return (
        <>
            <div className="header">
                <div className="header-inner">
                    <Link to="/" className="logo active">GigFrog</Link>
                    <nav className="nav">
                        <Link to="/pipeline">pipeline</Link>
                        <Link to="/leads">leads</Link>
                        <Link to="/referrals">referrals</Link>
                    </nav>
                    <div className="spacer"></div>
                    <button
                        className="dark-mode-toggle"
                        onClick={toggleDarkMode}
                        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                    <span className="user-info">
                        {displayName}
                        {isAdmin && <span className="admin-badge">admin</span>}
                        {' | '}
                        <button className="logout-btn" onClick={handleLogout}>logout</button>
                    </span>
                </div>
            </div>
        </>
    );
};

export default Header;