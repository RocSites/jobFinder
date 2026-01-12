// Updated LeadDetail.jsx component with proper status handling
// Place this in: src/pages/LeadDetail.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../hooks/useToast.jsx';
import './LeadDetail.css';

const LeadDetail = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const isNewLead = leadId === 'new';
  const { showToast, ToastComponent } = useToast();

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

  // Edit mode state
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);

  // Save button state
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState('');

  const parseJobUrl = async (url) => {
    try {
      // Use backend proxy to fetch URL and avoid CORS issues
      const response = await fetch('/.netlify/functions/parse-job-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job URL');
      }

      const { html } = await response.json();

      // Create a DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extract job title - try multiple selectors
      let title = doc.querySelector('h1')?.textContent?.trim() ||
                  doc.querySelector('h2')?.textContent?.trim() ||
                  doc.querySelector('[class*="title"]')?.textContent?.trim() ||
                  doc.querySelector('[class*="job-title"]')?.textContent?.trim() || '';

      // Extract company name - try multiple methods
      let company = doc.querySelector('[class*="company"]')?.textContent?.trim() ||
                    doc.querySelector('[class*="Company"]')?.textContent?.trim() ||
                    doc.querySelector('[class*="employer"]')?.textContent?.trim() || '';

      // If company not found in DOM, try to extract from URL
      if (!company) {
        const urlMatch = url.match(/\/\/([^.\/]+)\./);
        if (urlMatch && urlMatch[1]) {
          company = urlMatch[1].charAt(0).toUpperCase() + urlMatch[1].slice(1);
        }
      }

      // Extract location - try multiple selectors and smart filtering
      let location = doc.querySelector('[class*="location"]')?.textContent?.trim() ||
                     doc.querySelector('[class*="Location"]')?.textContent?.trim() ||
                     doc.querySelector('[class*="office"]')?.textContent?.trim() || '';

      // If no location found, search for "Remote" in the page text
      if (!location) {
        const bodyText = doc.body?.textContent || '';
        if (/\b(remote|work from home|wfh)\b/i.test(bodyText)) {
          location = 'Remote';
        }
      }

      // Also check URL path for location hints like "usa-remote"
      if (!location || location.length > 100) {
        const urlLocationMatch = url.match(/\/(usa|us|remote|anywhere|global)[\-_]?(remote|anywhere)?/i);
        if (urlLocationMatch) {
          const parts = urlLocationMatch[0].split(/[\-_\/]/).filter(p => p && p !== 'co');
          location = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        }
      }

      // Filter out locations that are too long (likely not a real location)
      if (location && location.length > 100) {
        location = '';
      }

      // Try to find compensation - look for salary, compensation keywords
      let compensation = '';
      const compElements = doc.querySelectorAll('*');
      for (let el of compElements) {
        const text = el.textContent;
        if (text && (text.includes('$') || text.includes('salary') || text.includes('compensation'))) {
          const match = text.match(/\$[\d,]+(k|K)?\s*-?\s*\$?[\d,]+(k|K)?/);
          if (match) {
            compensation = match[0];
            break;
          }
        }
      }

      // Try to find date posted
      let datePosted = '';
      const dateElements = doc.querySelectorAll('[class*="date"], [class*="posted"], time');
      if (dateElements.length > 0) {
        const dateText = dateElements[0].textContent?.trim() || dateElements[0].getAttribute('datetime');
        if (dateText) {
          const date = new Date(dateText);
          if (!isNaN(date.getTime())) {
            datePosted = date.toISOString().split('T')[0];
          }
        }
      }

      return { title, company, location, compensation, datePosted };
    } catch (error) {
      console.error('Error parsing job URL:', error);
      showToast('Error parsing the job URL. Please check the URL and try again.', 'error');
      return null;
    }
  };

  const handleImportUrl = async () => {
    if (!importUrl.trim()) {
      showToast('Please enter a URL', 'error');
      return;
    }

    const jobData = await parseJobUrl(importUrl);
    if (jobData) {
      setLead({
        ...lead,
        title: jobData.title || lead.title,
        company: jobData.company || lead.company,
        location: jobData.location || lead.location,
        compensation: { raw: jobData.compensation || lead.compensation?.raw || '' },
        datePosted: jobData.datePosted || lead.datePosted,
        sourceApplicationLink: importUrl
      });
      setShowImportModal(false);
      setImportUrl('');
    }
  };

  useEffect(() => {
    if (isNewLead) {
      // Initialize empty lead for new entry
      setLead({
        title: '',
        company: '',
        location: '',
        team: '',
        compensation: { raw: '' },
        industry: '',
        datePosted: '',
        contactName: '',
        contactEmail: '',
        contactLinkedIn: '',
        sourceApplicationLink: '',
        sourceLink: ''
      });
      setStatus('saved'); // Auto-set to saved for new leads
      setLoading(false);
    } else {
      fetchLeadDetails();
    }
  }, [leadId, isNewLead]);

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
      if (isNewLead) {
        // Create new lead first, then create userLead
        const newLeadData = {
          title: lead.title,
          company: lead.company,
          location: lead.location,
          team: lead.team,
          compensation: { raw: lead.compensation?.raw || '' },
          industry: lead.industry,
          datePosted: lead.datePosted || new Date(),
          contactName: lead.contactName,
          contactEmail: lead.contactEmail,
          contactLinkedIn: lead.contactLinkedIn,
          sourceApplicationLink: lead.sourceApplicationLink,
          sourceLink: lead.sourceLink
        };

        const createdLead = await api.leads.create(newLeadData);

        // Now create userLead with status 'saved'
        await api.userLeads.save({
          leadId: createdLead._id,
          priority,
          notes,
          currentStatus: 'saved'
        });

        showToast('Lead created and saved to pipeline!', 'success');
        navigate(`/leads/${createdLead._id}`);
      } else if (userLead) {
        // Update existing userLead
        await api.userLeads.update(userLead._id, { priority, notes });

        // If in edit mode, also update the lead itself
        if (isEditingBasic || isEditingContact) {
          const updatedLeadData = {
            title: lead.title,
            company: lead.company,
            location: lead.location,
            team: lead.team,
            compensation: { raw: lead.compensation?.raw || '' },
            industry: lead.industry,
            datePosted: lead.datePosted,
            contactName: lead.contactName,
            contactEmail: lead.contactEmail,
            contactLinkedIn: lead.contactLinkedIn,
            sourceApplicationLink: lead.sourceApplicationLink,
            sourceLink: lead.sourceLink
          };
          await api.leads.update(lead._id, updatedLeadData);
          setIsEditingBasic(false);
          setIsEditingContact(false);
        }

        // Show "Saved" confirmation
        setShowSavedConfirmation(true);

        // Reset back to "Save Changes" after 1.5 seconds
        setTimeout(() => {
          setShowSavedConfirmation(false);
        }, 1500);

        fetchLeadDetails(); // Refresh to get latest data
      } else {
        // Create new userLead for existing lead
        await api.userLeads.save({
          leadId: lead._id,
          priority,
          notes
        });
        showToast('Lead saved to pipeline!', 'success');
        fetchLeadDetails(); // Refresh to get the new userLead
      }
    } catch (err) {
      showToast(`Error saving: ${err.message}`, 'error');
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;

    if (!userLead) {
      showToast('Please save the lead first', 'error');
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
      showToast(`Error updating status: ${err.message}`, 'error');
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
        showToast('Note added!', 'success');
      } catch (err) {
        showToast(`Error saving note: ${err.message}`, 'error');
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
        showToast('Lead removed from pipeline', 'success');
        navigate('/pipeline');
      } catch (err) {
        showToast(`Error deleting: ${err.message}`, 'error');
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
        <div className="page-title-row">
          <div className="page-title">{isNewLead ? 'Add New Lead' : lead.title}</div>
          {isNewLead && (
            <button className="btn btn-import" onClick={() => setShowImportModal(true)}>
              Import Lead
            </button>
          )}
        </div>
        {!isNewLead && <div className="page-subtitle">{lead.company} | {lead.location}</div>}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Import Lead from URL</h3>
              <button className="modal-close" onClick={() => setShowImportModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-instruction">Copy and paste the link to the job application and click Import</p>
              <label htmlFor="import-url-input">Application URL</label>
              <input
                id="import-url-input"
                type="text"
                className="modal-input"
                placeholder="https://example.com/jobs/1234"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleImportUrl();
                  }
                }}
              />
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowImportModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleImportUrl}>Import</button>
            </div>
          </div>
        </div>
      )}

      <div className="content-grid">
        <div className="main-col">
          <div className="section">
            <div className="section-title">
              Basic Information
              {!isNewLead && !userLead && (
                <span className="edit-banner">Please save this lead first to enable editing</span>
              )}
              {!isNewLead && userLead && (
                <button
                  className="edit-icon-btn"
                  onClick={() => setIsEditingBasic(!isEditingBasic)}
                  title={isEditingBasic ? "Cancel editing" : "Edit basic information"}
                >
                  {isEditingBasic ? (
                    <span style={{ fontSize: '9pt' }}>Cancel</span>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  )}
                </button>
              )}
            </div>
            <table className="form-table">
              <tbody>

                <tr>
                  <td>Company</td>
                  <td>
                    <input
                      type="text"
                      value={lead.company}
                      onChange={(e) => setLead({ ...lead, company: e.target.value })}
                      readOnly={!isNewLead && !isEditingBasic}
                      placeholder={isNewLead ? "e.g. Acme Corp" : ""}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Position</td>
                  <td>
                    <input
                      type="text"
                      value={lead.title}
                      onChange={(e) => setLead({ ...lead, title: e.target.value })}
                      readOnly={!isNewLead && !isEditingBasic}
                      placeholder={isNewLead ? "e.g. Senior Software Engineer" : ""}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Location</td>
                  <td>
                    <input
                      type="text"
                      value={lead.location || ''}
                      onChange={(e) => setLead({ ...lead, location: e.target.value })}
                      readOnly={!isNewLead && !isEditingBasic}
                      placeholder={isNewLead ? "e.g. San Francisco, CA or Remote" : ""}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Team</td>
                  <td>
                    <input
                      type="text"
                      value={lead.team || ''}
                      onChange={(e) => setLead({ ...lead, team: e.target.value })}
                      readOnly={!isNewLead && !isEditingBasic}
                      placeholder={isNewLead ? "e.g. Engineering" : ""}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Compensation</td>
                  <td>
                    <input
                      type="text"
                      value={lead.compensation?.raw || ''}
                      onChange={(e) => setLead({ ...lead, compensation: { raw: e.target.value } })}
                      className="comp-value"
                      readOnly={!isNewLead && !isEditingBasic}
                      placeholder={isNewLead ? "e.g. $120k - $180k" : ""}
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
                  <td>
                    <input
                      type="text"
                      value={lead.industry || ''}
                      onChange={(e) => setLead({ ...lead, industry: e.target.value })}
                      readOnly={!isNewLead && !isEditingBasic}
                      placeholder={isNewLead ? "e.g. Technology, Finance" : ""}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Date Posted</td>
                  <td>
                    <input
                      type={(isNewLead || isEditingBasic) ? "date" : "text"}
                      value={(isNewLead || isEditingBasic) ? (lead.datePosted || '') : (lead.datePosted ? new Date(lead.datePosted).toLocaleDateString() : 'N/A')}
                      onChange={(e) => setLead({ ...lead, datePosted: e.target.value })}
                      readOnly={!isNewLead && !isEditingBasic}
                    />
                  </td>
                </tr>
                {(isNewLead || isEditingBasic || lead.sourceApplicationLink) && (
                  <tr>
                    <td>Application URL</td>
                    <td>
                      {(isNewLead || isEditingBasic) ? (
                        <input
                          type="text"
                          value={lead.sourceApplicationLink || ''}
                          onChange={(e) => setLead({ ...lead, sourceApplicationLink: e.target.value })}
                          placeholder="https://..."
                        />
                      ) : (
                        <a href={lead.sourceApplicationLink} target="_blank" rel="noopener noreferrer">
                          Apply Here →
                        </a>
                      )}
                    </td>
                  </tr>
                )}
                {(isNewLead || isEditingBasic || lead.sourceLink) && (
                  <tr>
                    <td>Source URL</td>
                    <td>
                      {(isNewLead || isEditingBasic) ? (
                        <input
                          type="text"
                          value={lead.sourceLink || ''}
                          onChange={(e) => setLead({ ...lead, sourceLink: e.target.value })}
                          placeholder="https://..."
                        />
                      ) : (
                        <a href={lead.sourceLink} target="_blank" rel="noopener noreferrer">
                          View Source →
                        </a>
                      )}
                    </td>
                  </tr>
                )}
                <tr>
                  <td>Stage</td>
                  <td>
                    <select value={status || ''} onChange={handleStatusChange} disabled={!userLead && !isNewLead}>
                      {!status && !isNewLead && <option value="">Not saved yet</option>}
                      <option value="saved">Saved</option>
                      <option value="applied">Applied</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="offer">Offer</option>
                      <option value="rejected">Rejected</option>
                      <option value="archived">Archived</option>
                    </select>
                  </td>
                </tr>
                {!isNewLead && (
                  <tr>
                    <td></td>
                    <td>
                      {userLead ? (
                        <button className="btn btn-primary saved-lead-btn" disabled>
                          Lead Saved
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
                              showToast(`Error saving lead: ${err.message}`, 'error');
                            }
                          }}
                        >
                          Save Lead
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="section">
            <div className="section-title">
              Contact Information
              {!isNewLead && !userLead && (
                <span className="edit-banner">Please save this lead first to enable editing</span>
              )}
              {!isNewLead && userLead && (
                <button
                  className="edit-icon-btn"
                  onClick={() => setIsEditingContact(!isEditingContact)}
                  title={isEditingContact ? "Cancel editing" : "Edit contact information"}
                >
                  {isEditingContact ? (
                    <span style={{ fontSize: '9pt' }}>Cancel</span>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  )}
                </button>
              )}
            </div>
            <table className="form-table">
              <tbody>
                <tr>
                  <td>Contact Name</td>
                  <td>
                    <input
                      type="text"
                      value={lead.contactName || ''}
                      onChange={(e) => setLead({ ...lead, contactName: e.target.value })}
                      readOnly={!isNewLead && !isEditingContact}
                      placeholder={isNewLead ? "e.g. Jane Doe" : ""}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Email</td>
                  <td>
                    {!isNewLead && !isEditingContact && lead.contactEmail ? (
                      <a href={`mailto:${lead.contactEmail}`}>{lead.contactEmail}</a>
                    ) : (
                      <input
                        type="email"
                        value={lead.contactEmail || ''}
                        onChange={(e) => setLead({ ...lead, contactEmail: e.target.value })}
                        readOnly={!isNewLead && !isEditingContact}
                        placeholder={isNewLead ? "email@example.com" : ""}
                      />
                    )}
                  </td>
                </tr>
                {(isNewLead || isEditingContact || lead.contactLinkedIn) && (
                  <tr>
                    <td>LinkedIn</td>
                    <td>
                      {(isNewLead || isEditingContact) ? (
                        <input
                          type="text"
                          value={lead.contactLinkedIn || ''}
                          onChange={(e) => setLead({ ...lead, contactLinkedIn: e.target.value })}
                          placeholder="https://linkedin.com/in/..."
                        />
                      ) : (
                        <a href={lead.contactLinkedIn} target="_blank" rel="noopener noreferrer">
                          View Profile →
                        </a>
                      )}
                    </td>
                  </tr>
                )}
                <tr>
                  <td>Notes</td>
                  <td>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows="10"
                      placeholder="Add your notes about this opportunity..."
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="add-note">
              <textarea
                placeholder="Add notes here..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows="5"
              />
              <button className="btn btn-primary" onClick={handleAddNote}>
                Add Note
              </button>
            </div>
          </div>

          <div className="actions">
            <button
              className={`btn ${showSavedConfirmation ? 'btn-saved' : 'btn-primary'}`}
              onClick={handleSave}
              disabled={showSavedConfirmation}
            >
              {showSavedConfirmation ? 'Saved' : (isNewLead ? 'Add Lead' : userLead ? 'Save Changes' : 'Save Lead to Pipeline')}
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
          </div>
        </div>
      </div>

      <ToastComponent />
    </div>
  );
};

export default LeadDetail;
