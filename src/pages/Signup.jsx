import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Signup = () => {
  const [step, setStep] = useState(1); // 1 = invite code, 2 = account details
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { signUp, validateInviteCode, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleValidateCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { valid, error: codeError } = await validateInviteCode(inviteCode);

      if (!valid) {
        setError(codeError);
        setLoading(false);
        return;
      }

      setStep(2);
    } catch (err) {
      setError('Error validating invite code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, inviteCode);
      setSuccess(true);
    } catch (err) {
      if (err.message.includes('User already registered')) {
        setError('An account with this email already exists.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div className="auth-header">
            <Link to="/" className="auth-logo">GigFrog</Link>
            <h1>Check Your Email</h1>
          </div>

          <div className="auth-success-message">
            <div className="success-icon">✓</div>
            <p>
              We've sent a verification link to <strong>{email}</strong>
            </p>
            <p className="auth-hint">
              Click the link in the email to verify your account, then you can log in.
            </p>
          </div>

          <div className="auth-footer">
            <p>
              Already verified? <Link to="/login">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <Link to="/" className="auth-logo">GigFrog</Link>
          <h1>Sign Up</h1>
          <div className="auth-steps">
            <span className={`step ${step >= 1 ? 'active' : ''}`}>1. Invite Code</span>
            <span className="step-divider">→</span>
            <span className={`step ${step >= 2 ? 'active' : ''}`}>2. Account</span>
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleValidateCode}>
            <div className="form-group">
              <label htmlFor="inviteCode">Invite Code</label>
              <input
                type="text"
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter your invite code"
                required
                autoComplete="off"
                style={{ textTransform: 'uppercase' }}
              />
              <p className="form-hint">
                GigFrog is currently invite-only. Enter your invite code to continue.
              </p>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Validating...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp}>
            <div className="invite-badge">
              Using code: <strong>{inviteCode}</strong>
              <button
                type="button"
                className="change-code-btn"
                onClick={() => setStep(1)}
              >
                Change
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
