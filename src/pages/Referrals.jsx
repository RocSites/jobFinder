import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Referrals.css';
import api from '../api/client';
import { useToast } from '../hooks/useToast.jsx';

const Referrals = () => {
  const { showToast, ToastComponent } = useToast();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const response = await api.referrals.getAll();
      setReferrals(response || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching referrals:', err);
      showToast(`Error loading referrals: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="main">
          <div className="page-title">Loading referrals...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="main">
          <div className="page-title">Error loading referrals</div>
          <p>{error}</p>
          <button onClick={fetchReferrals} className="btn">Retry</button>
        </div>
        <ToastComponent />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="main">
        <div className="page-title">Referrals</div>

        <div className="actions">
          <button className="btn" onClick={fetchReferrals}>Refresh</button>
          <Link to="/referrals/new" className="btn-add-referral">Add Referral</Link>
        </div>

        <div className="referrals-table-container">
          <table className="referrals-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>LinkedIn</th>
                <th>Linked Leads</th>
                <th>Date Added</th>
              </tr>
            </thead>
            <tbody>
              {referrals.length > 0 ? (
                referrals.map((referral) => (
                  <tr
                    key={referral._id}
                    onClick={() => window.location.href = `/referrals/${referral._id}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <Link to={`/referrals/${referral._id}`} className="referral-link">
                        {referral.name}
                      </Link>
                    </td>
                    <td>{referral.company || 'N/A'}</td>
                    <td>
                      {referral.email ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{referral.email}</span>
                          <button
                            className="copy-icon-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(referral.email);
                              const button = e.currentTarget;
                              const originalHTML = button.innerHTML;
                              button.innerHTML = '<span style="font-size: 8pt; color: #00a000; white-space: nowrap;">Copied!</span>';
                              button.style.padding = '4px 6px';
                              setTimeout(() => {
                                button.innerHTML = originalHTML;
                                button.style.padding = '4px';
                              }, 1500);
                            }}
                            title="Copy email"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          </button>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                      {referral.linkedin ? (
                        <a
                          href={referral.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="linkedin-link"
                        >
                          View Profile
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                      {referral.linkedLeads?.length > 0 ? (
                        <span className="linked-leads-count">{referral.linkedLeads.length}</span>
                      ) : (
                        '0'
                      )}
                    </td>
                    <td>
                      {referral.createdAt ? new Date(referral.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    No referrals found. Click "Add Referral" to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ToastComponent />
    </div>
  );
};

export default Referrals;
