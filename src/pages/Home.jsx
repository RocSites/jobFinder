import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Home.css';
import api from '../api/client';

const Home = () => {
  const location = useLocation();
  const [pipeline, setPipeline] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [location]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch pipeline data
      const pipelineData = await api.userLeads.getPipeline();
      setPipeline(pipelineData);

      // Fetch recent leads (for "New Leads for You" section)
      try {
        const leadsData = await api.leads.getAll({ page: 1, limit: 4 });
        setRecentLeads(leadsData.leads || []);
      } catch (err) {
        console.error('Error fetching recent leads:', err);
      }
    } catch (err) {
      console.error('Error fetching pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get leads for a specific status (limit to 3 for home page)
  const getLeadsByStatus = (status, limit = 3) => {
    const stage = pipeline.find(s => s._id === status);
    const leads = stage?.leads || [];
    return leads.slice(0, limit);
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
      <div className="container">
        <div className="main">
          <div className="section">
            <div className="section-header">
              <span>Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="main">
        <div className="section">
          <div className="section-header">
            <span>Pipeline</span>
            <Link to="/pipeline">view pipeline</Link>
          </div>
          <div className="pipeline">
            {statusColumns.map(column => {
              const leads = getLeadsByStatus(column.id);
              const totalCount = pipeline.find(s => s._id === column.id)?.count || 0;

              return (
                <div key={column.id} className="pipeline-col">
                  <div className="pipeline-col-header">
                    <span>{column.title}</span>
                    <span className="count">{totalCount}</span>
                  </div>
                  {leads.length > 0 ? (
                    leads.map(({ userLead, leadDetails }) => (
                      <div
                        key={userLead._id}
                        className="job-item"
                        onClick={() => window.location.href = `/leads/${leadDetails._id}`}
                      >
                        <div className="job-company">{leadDetails.company}</div>
                        <div className="job-title">
                          <Link to={`/leads/${leadDetails._id}`}>
                            {leadDetails.title}
                          </Link>
                        </div>
                        <div className="job-meta">
                          {leadDetails.location} | <span className="job-comp">
                            {leadDetails.compensation?.raw || 'N/A'}
                          </span>
                          {userLead.priority && (
                            <span className={`priority-badge priority-${userLead.priority}`}>
                              {userLead.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="job-item" style={{ color: '#828282', fontStyle: 'italic' }}>
                      No {column.title.toLowerCase()} leads
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="two-col">
          <div className="list-section">
            <div className="section-header">
              <span>Recent Messages</span>
              <a href="#">view messages</a>
            </div>
            <div className="list-item">
              <div className="item-content">
                <div className="item-title">
                  <span style={{ color: '#828282', fontStyle: 'italic' }}>No messages yet</span>
                </div>
                <div className="item-meta">
                  Messages feature coming soon
                </div>
              </div>
            </div>
          </div>

          <div className="list-section">
            <div className="section-header">
              <span>New Leads for You</span>
              <Link to="/leads">view all leads</Link>
            </div>
            {recentLeads.length > 0 ? (
              recentLeads.map((lead, index) => (
                <div key={lead._id} className="list-item">
                  <div className="item-number">{index + 1}.</div>
                  <div className="item-content">
                    <div className="item-title">
                      <Link to={`/leads/${lead._id}`}>{lead.title}</Link>
                    </div>
                    <div className="item-meta">
                      {lead.company} | {lead.location} | <span className="job-comp">
                        {lead.compensation?.raw || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="list-item">
                <div className="item-content">
                  <div className="item-title">
                    <span style={{ color: '#828282', fontStyle: 'italic' }}>No leads available yet</span>
                  </div>
                  <div className="item-meta">
                    Check back soon for new opportunities
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
