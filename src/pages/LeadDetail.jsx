// Updated LeadDetail.jsx component with proper status handling
// Place this in: src/pages/LeadDetail.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import './LeadDetail.css';

const LeadDetail = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  
  const [lead, setLead] = useState(null);
  const [userLead, setUserLead] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState(null);
  const [notes, setNotes] = useState('');
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    fetchLeadDetails();
  }, [leadId]);

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch lead details
      const leadData = await api.leads.getById(leadId);
      setLead(leadData);
      
      // Try to fetch user lead using the new by-lead endpoint
      try {
        const userLeadData = await api.userLeads.getByLeadId(leadId);
        setUserLead(userLeadData);
        setPriority(userLeadData.priority);
        setStatus(userLeadData.currentStatus); // ✅ This now gets the correct status!
        setNotes(userLeadData.notes || '');
        
        // Fetch activity using the ACTUAL userLead ID
        const activityData = await api.userLeads.getActivity(userLeadData._id);
        setActivity(activityData);
      } catch (err) {
        // Lead not saved yet, that's ok
        console.log('Lead not saved by user yet');
        // Keep default values
        setPriority('medium');
        setStatus(null);
        setNotes('');
        setActivity([]);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching lead:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (userLead) {
        // Update existing
        await api.userLeads.update(userLead._id, { priority, notes });
        alert('Changes saved!');
        fetchLeadDetails(); // Refresh to get latest data
      } else {
        // Create new
        await api.userLeads.save({
          leadId: lead._id,
          priority,
          notes
        });
        alert('Lead saved to pipeline!');
        fetchLeadDetails(); // Refresh to get the new userLead
      }
    } catch (err) {
      alert(`Error saving: ${err.message}`);
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;

    if (!userLead) {
      alert('Please save the lead first');
      e.target.value = status; // Reset dropdown
      return;
    }

    try {
      // Optimistically update UI
      setStatus(newStatus);

      // Make API call
      await api.userLeads.updateStatus(userLead._id, newStatus);

      // Refresh activity to show the status change in timeline
      await fetchLeadDetails();
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
      // Revert on error
      setStatus(status);
      e.target.value = status; // Reset dropdown on error
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    const updatedNotes = notes ? `${notes}\n\n[${new Date().toLocaleDateString()}] ${newNote}` : `[${new Date().toLocaleDateString()}] ${newNote}`;
    setNotes(updatedNotes);
    setNewNote('');
    
    if (userLead) {
      try {
        await api.userLeads.update(userLead._id, { notes: updatedNotes });
        alert('Note added!');
      } catch (err) {
        alert(`Error saving note: ${err.message}`);
      }
    }
  };

  const handleDelete = async () => {
    if (!userLead) {
      navigate('/leads');
      return;
    }
    
    if (window.confirm('Remove this lead from your pipeline?')) {
      try {
        await api.userLeads.remove(userLead._id);
        alert('Lead removed from pipeline');
        navigate('/pipeline');
      } catch (err) {
        alert(`Error deleting: ${err.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="main">
        <div className="page-title">Loading...</div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="main">
        <div className="page-title">Error loading lead</div>
        <p>{error}</p>
        <button onClick={() => navigate('/leads')}>Back to Leads</button>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="page-header">
        <button onClick={() => navigate(-1, { state: { refresh: Date.now() } })} className="back-link">← back</button>
        <div className="page-title">{lead.title}</div>
        <div className="page-subtitle">{lead.company} | {lead.location}</div>
      </div>

      <div className="content-grid">
        <div className="main-col">
          <div className="section">
            <div className="section-title">Basic Information</div>
            <table className="form-table">
              <tbody>
                <tr>
                  <td>Position</td>
                  <td><input type="text" value={lead.title} readOnly /></td>
                </tr>
                <tr>
                  <td>Company</td>
                  <td><input type="text" value={lead.company} readOnly /></td>
                </tr>
                <tr>
                  <td>Location</td>
                  <td><input type="text" value={lead.location || 'N/A'} readOnly /></td>
                </tr>
                <tr>
                  <td>Team</td>
                  <td><input type="text" value={lead.team || 'N/A'} readOnly /></td>
                </tr>
                <tr>
                  <td>Compensation</td>
                  <td>
                    <input 
                      type="text" 
                      value={lead.compensation?.raw || 'N/A'} 
                      className="comp-value"
                      readOnly 
                    />
                  </td>
                </tr>
                <tr>
                  <td>Priority</td>
                  <td>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td>Industry</td>
                  <td><input type="text" value={lead.industry || 'N/A'} readOnly /></td>
                </tr>
                <tr>
                  <td>Date Posted</td>
                  <td>
                    <input
                      type="text"
                      value={lead.datePosted ? new Date(lead.datePosted).toLocaleDateString() : 'N/A'}
                      readOnly
                    />
                  </td>
                </tr>
                {lead.sourceApplicationLink && (
                  <tr>
                    <td>Application URL</td>
                    <td>
                      <a href={lead.sourceApplicationLink} target="_blank" rel="noopener noreferrer">
                        Apply Here →
                      </a>
                    </td>
                  </tr>
                )}
                {lead.sourceLink && (
                  <tr>
                    <td>Source URL</td>
                    <td>
                      <a href={lead.sourceLink} target="_blank" rel="noopener noreferrer">
                        View Source →
                      </a>
                    </td>
                  </tr>
                )}
                <tr>
                  <td>Stage</td>
                  <td>
                    <select value={status || ''} onChange={handleStatusChange} disabled={!userLead}>
                      {!status && <option value="">Not saved yet</option>}
                      <option value="saved">Saved</option>
                      <option value="applied">Applied</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="offer">Offer</option>
                      <option value="rejected">Rejected</option>
                      <option value="archived">Archived</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td>
                    {userLead ? (
                      <button className="btn btn-primary saved-lead-btn" disabled>
                        Saved
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary save-lead-btn"
                        onClick={async () => {
                          try {
                            await api.userLeads.save({
                              leadId: lead._id,
                              priority,
                              notes
                            });
                            await fetchLeadDetails();
                          } catch (err) {
                            alert(`Error saving lead: ${err.message}`);
                          }
                        }}
                      >
                        Save Lead
                      </button>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="section">
            <div className="section-title">Contact Information</div>
            <table className="form-table">
              <tbody>
                <tr>
                  <td>Contact Name</td>
                  <td><input type="text" value={lead.contactName || 'N/A'} readOnly /></td>
                </tr>
                <tr>
                  <td>Email</td>
                  <td>
                    {lead.contactEmail ? (
                      <a href={`mailto:${lead.contactEmail}`}>{lead.contactEmail}</a>
                    ) : (
                      <input type="text" value="N/A" readOnly />
                    )}
                  </td>
                </tr>
                {lead.contactLinkedIn && (
                  <tr>
                    <td>LinkedIn</td>
                    <td>
                      <a href={lead.contactLinkedIn} target="_blank" rel="noopener noreferrer">
                        View Profile →
                      </a>
                    </td>
                  </tr>
                )}
                <tr>
                  <td>Notes</td>
                  <td>
                    <textarea 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)}
                      rows="6"
                      placeholder="Add your notes about this opportunity..."
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="actions">
            <button className="btn btn-primary" onClick={handleSave}>
              {userLead ? 'Save Changes' : 'Save Lead to Pipeline'}
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              {userLead ? 'Remove from Pipeline' : 'Back'}
            </button>
          </div>
        </div>

        <div className="side-col">
          <div className="section">
            <div className="section-title">Activity & Timeline</div>

            {userLead && status && (
              <div className="lead-status-badge">
                <strong>Current Status:</strong> {status}
              </div>
            )}

            {activity.length > 0 ? (
              activity.map((item, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-meta">
                    {new Date(item.createdAt).toLocaleString()} | {item.action.replace('_', ' ')}
                  </div>
                  <div className="activity-text">{item.description}</div>
                </div>
              ))
            ) : userLead ? (
              <div className="activity-item">
                <div className="activity-text">No activity yet. Start tracking your progress!</div>
              </div>
            ) : (
              <div className="activity-item">
                <div className="activity-text">Save this lead to start tracking activity</div>
              </div>
            )}

            <div className="add-note">
              <textarea 
                placeholder="Add a quick note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows="3"
              />
              <button className="btn btn-primary" onClick={handleAddNote}>
                Add Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetail;
