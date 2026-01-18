import './Header.css'
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";

const Header = () => {
    const { user, signOut, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved === 'true';
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const sidebarRef = useRef(null);

    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);

    // Close sidebar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setSidebarOpen(false);
            }
        };

        if (sidebarOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [sidebarOpen]);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    const handleLogout = async () => {
        setMobileMenuOpen(false);
        setSidebarOpen(false);
        try {
            await signOut();
        } catch (err) {
            // Ignore AbortError - logout still works
            if (err.name !== 'AbortError') {
                console.error('Logout error:', err);
            }
        }
        // Always navigate to login after logout attempt
        navigate('/login');
    };

    const handleProfileClick = () => {
        setMobileMenuOpen(false);
        setSidebarOpen(false);
        navigate('/profile');
    };

    // Get display name and initials from email
    const displayName = user?.email?.split('@')[0] || 'user';
    const initials = displayName.slice(0, 2).toUpperCase();

    return (
        <>
            <div className="header">
                <div className="header-inner">
                    <Link to="/" className="logo active">GigFrog</Link>

                    {/* Desktop nav */}
                    <nav className="nav desktop-nav">
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

                    {/* Desktop avatar */}
                    <div className="avatar-container desktop-only" ref={sidebarRef}>
                        <button
                            className="avatar-btn"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            title={displayName}
                        >
                            {initials}
                            {isAdmin && <span className="avatar-admin-dot"></span>}
                        </button>

                        {/* Sidebar dropdown */}
                        {sidebarOpen && (
                            <div className="sidebar-dropdown">
                                <div className="sidebar-header">
                                    <span className="sidebar-email">{user?.email}</span>
                                    {isAdmin && <span className="admin-badge">admin</span>}
                                </div>
                                <div className="sidebar-divider"></div>
                                <button className="sidebar-item" onClick={handleProfileClick}>
                                    Profile
                                </button>
                                <button className="sidebar-item sidebar-logout" onClick={handleLogout}>
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="mobile-menu-btn mobile-only"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Menu"
                    >
                        <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>
                    </button>
                </div>
            </div>

            {/* Mobile menu overlay */}
            {mobileMenuOpen && (
                <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
                    <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
                        <div className="mobile-menu-header">
                            <span className="mobile-menu-email">{user?.email}</span>
                            {isAdmin && <span className="admin-badge">admin</span>}
                        </div>
                        <div className="mobile-menu-divider"></div>
                        <nav className="mobile-nav">
                            <Link to="/pipeline" onClick={() => setMobileMenuOpen(false)}>Pipeline</Link>
                            <Link to="/leads" onClick={() => setMobileMenuOpen(false)}>Leads</Link>
                            <Link to="/referrals" onClick={() => setMobileMenuOpen(false)}>Referrals</Link>
                        </nav>
                        <div className="mobile-menu-divider"></div>
                        <button className="mobile-menu-item" onClick={handleProfileClick}>
                            Profile
                        </button>
                        <button className="mobile-menu-item mobile-logout" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
