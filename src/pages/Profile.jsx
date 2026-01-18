import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

const Profile = () => {
    const { user, userProfile, isAdmin } = useAuth();

    const displayName = user?.email?.split('@')[0] || 'user';
    const initials = displayName.slice(0, 2).toUpperCase();

    return (
        <div className="profile-page">
            <div className="profile-card">
                <div className="profile-avatar">
                    {initials}
                </div>
                <h1 className="profile-name">{displayName}</h1>
                {isAdmin && <span className="profile-admin-badge">Admin</span>}

                <div className="profile-info">
                    <div className="profile-row">
                        <span className="profile-label">Email</span>
                        <span className="profile-value">{user?.email}</span>
                    </div>
                    <div className="profile-row">
                        <span className="profile-label">Member since</span>
                        <span className="profile-value">
                            {user?.created_at
                                ? new Date(user.created_at).toLocaleDateString()
                                : 'Unknown'}
                        </span>
                    </div>
                    {userProfile?.invite_code_used && (
                        <div className="profile-row">
                            <span className="profile-label">Invite code</span>
                            <span className="profile-value">{userProfile.invite_code_used}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
