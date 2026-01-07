// Updated Leads.jsx component with API integration
// Place this in: src/pages/Leads.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Leads.css';
import api from '../api/client';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    highPriority: 0,
    activeThisWeek: 0
  });

  // Fetch leads on component mount
  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await api.leads.getAll({ page: 1, limit: 50 });
      setLeads(response.leads || []);
      
      // Calculate stats (you can also create a separate API endpoint for this)
      setStats({
        total: response.totalLeads || 0,
        highPriority: 5, // This would come from your API
        activeThisWeek: 8 // This would come from your API
      });
    } catch (err) {
      setError(err.message);
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLead = async (leadId) => {
    try {
      await api.userLeads.save({
        leadId,
        priority: 'medium'
      });
      // Refresh leads or update UI
      alert('Lead saved successfully!');
    } catch (err) {
      alert(`Error saving lead: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="main">
          <div className="page-title">Loading leads...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="main">
          <div className="page-title">Error loading leads</div>
          <p>{error}</p>
          <button onClick={fetchLeads}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="main">
        <div className="page-title">Leads</div>

        <div className="stats">
          <span>{stats.total} leads</span>
          <span>{stats.highPriority} high priority</span>
          <span>{stats.activeThisWeek} active this week</span>
        </div>

        <div className="actions">
          <button onClick={fetchLeads}>Refresh leads</button>
          <a href="#">Filter</a>
        </div>

        <table className="leads-table">
          <thead>
            <tr>
              <th>Priority</th>
              <th>Position</th>
              <th>Company</th>
              <th>Location</th>
              <th>Compensation</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Industry</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead._id}>
                <td>
                  <span className="priority priority-medium">Medium</span>
                </td>
                <td>
                  <Link to={`/leads/${lead._id}`} className="position-link">
                    {lead.title}
                  </Link>
                </td>
                <td>{lead.company}</td>
                <td>{lead.location}</td>
                <td>
                  <span className="comp">
                    {lead.compensation?.raw || 
                     (lead.compensation?.min && lead.compensation?.max 
                       ? `$${lead.compensation.min}-$${lead.compensation.max}` 
                       : 'N/A')}
                  </span>
                </td>
                <td>{lead.contactName || 'N/A'}</td>
                <td>{lead.contactEmail || 'N/A'}</td>
                <td>{lead.industry || 'N/A'}</td>
                <td>
                  <button 
                    className="action-btn"
                    onClick={() => handleSaveLead(lead._id)}
                  >
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {leads.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>No leads found. Import your CSV to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leads;
