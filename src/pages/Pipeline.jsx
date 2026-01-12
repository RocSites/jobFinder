// Updated Pipeline.jsx component with API integration
// Place this in: src/pages/Pipeline.jsx

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Pipeline.css';
import api from '../api/client';
import { useToast } from '../hooks/useToast.jsx';

const Pipeline = () => {
  const location = useLocation();
  const { showToast, ToastComponent } = useToast();
  const [pipeline, setPipeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    activeLeads: 0,
    applied: 0,
    interviewing: 0,
    offers: 0
  });

  // Re-fetch pipeline on mount and when location changes
  useEffect(() => {
    fetchPipeline();
  }, [location]); // Re-run when location object changes (including state)

  const fetchPipeline = async () => {
    try {
      setLoading(true);
      const data = await api.userLeads.getPipeline();
      setPipeline(data);

      // Calculate stats from pipeline data
      const stats = {
        activeLeads: data.reduce((sum, stage) => sum + stage.count, 0),
        applied: data.find(s => s._id === 'applied')?.count || 0,
        interviewing: data.find(s => s._id === 'interviewing')?.count || 0,
        offers: data.find(s => s._id === 'offer')?.count || 0
      };
      setStats(stats);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userLeadId, newStatus) => {
    try {
      await api.userLeads.updateStatus(userLeadId, newStatus);
      // Refresh pipeline
      fetchPipeline();
    } catch (err) {
      showToast(`Error updating status: ${err.message}`, 'error');
    }
  };

  // Helper to get leads for a specific status (sorted by priority)
  const getLeadsByStatus = (status) => {
    const stage = pipeline.find(s => s._id === status);
    const leads = stage?.leads || [];

    // Sort by priority
    const priorityValue = { "high": 3, "medium": 2, "low": 1 };
    return [...leads].sort((a, b) => {
      const aPriority = priorityValue[a.userLead?.priority] ?? 0;
      const bPriority = priorityValue[b.userLead?.priority] ?? 0;
      return bPriority - aPriority;
    });
  };

  // Status display mapping
  const statusColumns = [
    { id: 'saved', title: 'Saved' },
    { id: 'applied', title: 'Applied' },
    { id: 'interviewing', title: 'Interviewing' },
    { id: 'offer', title: 'Offer' }
  ];

  if (loading) {
    return (
      <div className="main">
        <div className="page-title">Loading pipeline...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main">
        <div className="page-title">Error loading pipeline</div>
        <p>{error}</p>
        <button onClick={fetchPipeline}>Retry</button>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="page-title">Pipeline</div>

      <div className="stats">
        <span>{stats.activeLeads} active leads</span>
        <span>{stats.applied} applications sent</span>
        <span>{stats.interviewing} interviews</span>
        <span>{stats.offers} offer{stats.offers !== 1 ? 's' : ''}</span>
      </div>
      <Link to="/leads/new" className="btn-add-lead-pipeline">Add Lead</Link>

      <div className="pipeline-table">
        {statusColumns.map(column => {
          const leads = getLeadsByStatus(column.id);
          const count = leads.length;

          return (
            <div key={column.id} className="pipeline-col">
              <div className="col-header">
                {column.title} <span className="count">{count}</span>
              </div>

              {leads.map(({ userLead, leadDetails }) => (
                <div
                  key={userLead._id}
                  className="job-card"
                  onClick={() => window.location.href = `/leads/${leadDetails._id}`}
                >
                  <div className="job-company">{leadDetails.company}</div>
                  <div className="job-title">
                    <Link to={`/leads/${leadDetails._id}`}>
                      {leadDetails.title}
                    </Link>
                  </div>
                  <div className="job-meta">
                    {leadDetails.location} |
                    <span className="job-comp">
                      {leadDetails.compensation?.raw || 'N/A'}
                    </span>
                    {userLead.priority && (
                      <span className={`priority-badge priority-${userLead.priority}`}>
                        {userLead.priority}
                      </span>
                    )}
                  </div>

                  {/* Status change buttons */}
                  <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                    {column.id === 'saved' && (
                      <button
                        className="btn-sm"
                        onClick={() => handleStatusChange(userLead._id, 'applied')}
                      >
                        Mark Applied →
                      </button>
                    )}
                    {column.id === 'applied' && (
                      <>
                        <button
                          className="btn-sm btn-secondary"
                          onClick={() => handleStatusChange(userLead._id, 'saved')}
                          title="Move back to Saved"
                        >
                          ← Back
                        </button>
                        <button
                          className="btn-sm"
                          onClick={() => handleStatusChange(userLead._id, 'interviewing')}
                        >
                          Interview →
                        </button>
                      </>
                    )}
                    {column.id === 'interviewing' && (
                      <>
                        <button
                          className="btn-sm btn-secondary"
                          onClick={() => handleStatusChange(userLead._id, 'applied')}
                          title="Move back to Applied"
                        >
                          ← Back
                        </button>
                        <button
                          className="btn-sm"
                          onClick={() => handleStatusChange(userLead._id, 'offer')}
                        >
                          Got Offer! →
                        </button>
                      </>
                    )}
                    {column.id === 'offer' && (
                      <button
                        className="btn-sm btn-secondary"
                        onClick={() => handleStatusChange(userLead._id, 'interviewing')}
                        title="Move back to Interviewing"
                      >
                        ← Back
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {count === 0 && (
                <div className="empty-state">
                  No {column.title.toLowerCase()} leads
                </div>
              )}
            </div>
          );
        })}
      </div>
      <ToastComponent />
    </div>
  );
};

export default Pipeline;
