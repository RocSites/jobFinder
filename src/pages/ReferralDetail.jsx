import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../hooks/useToast.jsx';
import './ReferralDetail.css';

const ReferralDetail = () => {
  const { referralId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isNewReferral = referralId === 'new';

  // Get linkLeadId from navigation state (when coming from LeadDetail)
  const linkLeadFromState = location.state?.linkLeadId;
  const leadTitleFromState = location.state?.leadTitle;
  const leadCompanyFromState = location.state?.leadCompany;
  const { showToast, ToastComponent } = useToast();

  const [referral, setReferral] = useState(null);
  const [activity, setActivity] = useState([]);
  const [linkedLeads, setLinkedLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [notes, setNotes] = useState('');
  const [newNote, setNewNote] = useState('');

  // Modal state for linking leads
  const [showLinkLeadModal, setShowLinkLeadModal] = useState(false);
  const [availableLeads, setAvailableLeads] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isNewReferral) {
      fetchReferralData();
    } else {
      setLoading(false);
    }
  }, [referralId]);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const referralData = await api.referrals.getById(referralId);
      setReferral(referralData);
      setName(referralData.name || '');
      setCompany(referralData.company || '');
      setEmail(referralData.email || '');
      setLinkedin(referralData.linkedin || '');
      setNotes(referralData.notes || '');

      // Fetch linked leads details
      if (referralData.linkedLeads && referralData.linkedLeads.length > 0) {
        const leadsData = await Promise.all(
          referralData.linkedLeads.map(leadId => api.userLeads.getById(leadId))
        );
        setLinkedLeads(leadsData.filter(Boolean));
      } else {
        setLinkedLeads([]); // Reset if no linked leads
      }

      // Fetch activity
      const activityData = await api.referrals.getActivity(referralId);
      setActivity(activityData || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching referral:', err);
      showToast(`Error loading referral: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReferral = async () => {
    try {
      if (!name.trim()) {
        showToast('Please enter a name', 'error');
        return;
      }

      // Include linked lead from state if coming from LeadDetail
      const linkedLeadsArray = referral?.linkedLeads || [];
      if (isNewReferral && linkLeadFromState && !linkedLeadsArray.includes(linkLeadFromState)) {
        linkedLeadsArray.push(linkLeadFromState);
      }

      const referralData = {
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        linkedin: linkedin.trim(),
        notes: notes.trim(),
        linkedLeads: linkedLeadsArray
      };

      if (isNewReferral) {
        const newReferral = await api.referrals.create(referralData);
        showToast('Referral saved successfully', 'success');
        navigate(`/referrals/${newReferral._id}`, { replace: true });
      } else {
        await api.referrals.update(referralId, referralData);
        showToast('Referral updated successfully', 'success');
        fetchReferralData();
      }
    } catch (err) {
      console.error('Error saving referral:', err);
      showToast(`Error saving referral: ${err.message}`, 'error');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      showToast('Please enter a note', 'error');
      return;
    }

    try {
      const updatedNotes = notes ? `${notes}\n\n${new Date().toLocaleString()}: ${newNote}` : `${new Date().toLocaleString()}: ${newNote}`;
      await api.referrals.update(referralId, { notes: updatedNotes });
      setNotes(updatedNotes);
      setNewNote('');
      showToast('Note added successfully', 'success');
      fetchReferralData();
    } catch (err) {
      console.error('Error adding note:', err);
      showToast(`Error adding note: ${err.message}`, 'error');
    }
  };

  const handleLinkLead = async () => {
    if (!selectedLeadId) {
      showToast('Please select a lead', 'error');
      return;
    }

    try {
      const updatedLinkedLeads = [...(referral.linkedLeads || []), selectedLeadId];
      await api.referrals.update(referralId, { linkedLeads: updatedLinkedLeads });
      showToast('Lead linked successfully', 'success');
      setShowLinkLeadModal(false);
      setSelectedLeadId('');
      fetchReferralData();
    } catch (err) {
      console.error('Error linking lead:', err);
      showToast(`Error linking lead: ${err.message}`, 'error');
    }
  };

  const handleUnlinkLead = async (leadId) => {
    try {
      const updatedLinkedLeads = referral.linkedLeads.filter(id => id !== leadId);
      await api.referrals.update(referralId, { linkedLeads: updatedLinkedLeads });
      showToast('Lead unlinked successfully', 'success');
      fetchReferralData();
    } catch (err) {
      console.error('Error unlinking lead:', err);
      showToast(`Error unlinking lead: ${err.message}`, 'error');
    }
  };

  const openLinkLeadModal = async () => {
    try {
      // Fetch all saved leads
      const userLeads = await api.userLeads.getAll();
      // Filter out already linked leads
      const alreadyLinkedIds = new Set(referral?.linkedLeads || []);
      const available = userLeads.filter(lead => !alreadyLinkedIds.has(lead._id));
      setAvailableLeads(available);
      setSearchQuery(''); // Reset search when opening modal
      setSelectedLeadId(''); // Reset selection
      setShowLinkLeadModal(true);
    } catch (err) {
      console.error('Error fetching leads:', err);
      showToast(`Error loading leads: ${err.message}`, 'error');
    }
  };

  // Filter available leads based on search query
  const filteredLeads = availableLeads.filter((lead) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const title = lead.leadId?.title?.toLowerCase() || '';
    const company = lead.leadId?.company?.toLowerCase() || '';
    const location = lead.leadId?.location?.toLowerCase() || '';
    return title.includes(query) || company.includes(query) || location.includes(query);
  });

  if (loading) {
    return (
      <div className="container">
        <div className="main">
          <div className="page-title">Loading...</div>
        </div>
      </div>
    );
  }

  if (error && !isNewReferral) {
    return (
      <div className="container">
        <div className="main">
          <div className="page-title">Error</div>
          <p>{error}</p>
          <button onClick={() => navigate('/referrals')} className="btn">Back to Referrals</button>
        </div>
        <ToastComponent />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="main">
        <div className="page-header">
          <button onClick={() => navigate('/referrals')} className="btn-back">
            ← Back to Referrals
          </button>
          <div className="page-title">{isNewReferral ? 'Add New Referral' : 'Referral Details'}</div>
        </div>

        <div className="referral-detail-content">
          <div className="main-col">
            {/* Show linked lead notice when coming from LeadDetail */}
            {isNewReferral && linkLeadFromState && (
              <div className="linked-lead-notice">
                This referral will be linked to: <strong>{leadTitleFromState}</strong> at <strong>{leadCompanyFromState}</strong>
              </div>
            )}

            {/* Basic Information */}
            <div className="section">
              <div className="section-title">Basic Information</div>

              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter referral name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="company">Company</label>
                <input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Enter company name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="linkedin">LinkedIn</label>
                <input
                  id="linkedin"
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this referral..."
                  rows="6"
                />
              </div>

              <div className="form-actions">
                <button onClick={handleSaveReferral} className="btn btn-primary">
                  {isNewReferral ? 'Add Referral' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Add Note Section */}
            {!isNewReferral && (
              <div className="section">
                <div className="section-title">Add Note</div>
                <div className="form-group">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a new note..."
                    rows="3"
                  />
                </div>
                <button onClick={handleAddNote} className="btn">Add Note</button>
              </div>
            )}

            {/* Linked Leads */}
            {!isNewReferral && (
              <div className="section">
                <div className="section-title">Linked Leads</div>
                <button onClick={openLinkLeadModal} className="btn" style={{ marginBottom: '12px' }}>
                  Link Lead
                </button>

                {linkedLeads.length > 0 ? (
                  <div className="linked-leads-list">
                    {linkedLeads.map((lead) => (
                      <div key={lead._id} className="linked-lead-item">
                        <div className="linked-lead-info">
                          <div className="linked-lead-title">
                            <a href={`/leads/${lead.leadId?._id || lead.leadId}`} target="_blank" rel="noopener noreferrer">
                              {lead.leadId?.title || 'Unknown Position'}
                            </a>
                          </div>
                          <div className="linked-lead-company">
                            {lead.leadId?.company || 'Unknown Company'} • {lead.currentStatus || 'No status'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnlinkLead(lead._id)}
                          className="btn-unlink"
                          title="Unlink this lead"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-message">No linked leads yet. Click "Link Lead" to connect this referral to your job applications.</p>
                )}
              </div>
            )}
          </div>

          {/* Side Column - Activity */}
          {!isNewReferral && (
            <div className="side-col">
              <div className="section">
                <div className="section-title">Activity & Timeline</div>
                {activity.length > 0 ? (
                  activity.map((item, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-meta">
                        {new Date(item.createdAt).toLocaleString()} | {item.action.replace('_', ' ')}
                      </div>
                      <div className="activity-text">{item.description}</div>
                    </div>
                  ))
                ) : (
                  <div className="activity-item">
                    <div className="activity-text">No activity yet.</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Link Lead Modal */}
      {showLinkLeadModal && (
        <div className="modal-overlay" onClick={() => setShowLinkLeadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Link Lead</h3>
              <button className="modal-close" onClick={() => setShowLinkLeadModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-instruction">Search and select a lead from your pipeline to link to this referral</p>

              <label htmlFor="lead-search">Search Leads</label>
              <input
                id="lead-search"
                type="text"
                className="modal-input"
                placeholder="Search by position, company, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <label htmlFor="lead-select" style={{ marginTop: '12px', display: 'block' }}>
                Select Lead ({filteredLeads.length} available)
              </label>
              <select
                id="lead-select"
                className="modal-select"
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                size="8"
              >
                <option value="">-- Select a lead --</option>
                {filteredLeads.map((lead) => (
                  <option key={lead._id} value={lead._id}>
                    {lead.leadId?.title || 'Unknown'} - {lead.leadId?.company || 'Unknown Company'} - {lead.leadId?.location || 'N/A'}
                  </option>
                ))}
              </select>

              {filteredLeads.length === 0 && availableLeads.length > 0 && (
                <p style={{ fontSize: '9pt', color: '#999999', marginTop: '8px', fontStyle: 'italic' }}>
                  No leads match your search. Try a different query.
                </p>
              )}

              {availableLeads.length === 0 && (
                <p style={{ fontSize: '9pt', color: '#999999', marginTop: '8px', fontStyle: 'italic' }}>
                  No available leads to link. All leads in your pipeline are already linked.
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowLinkLeadModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleLinkLead}>Link Lead</button>
            </div>
          </div>
        </div>
      )}

      <ToastComponent />
    </div>
  );
};

export default ReferralDetail;
