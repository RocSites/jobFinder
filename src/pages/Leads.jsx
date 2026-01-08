// Updated Leads.jsx component with API integration
// Place this in: src/pages/Leads.jsx

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Leads.css';
import api from '../api/client';

const Leads = () => {
  const location = useLocation();
  const [leads, setLeads] = useState([]);
  const [savedLeads, setSavedLeads] = useState(new Set());
  const [userLeadsMap, setUserLeadsMap] = useState(new Map()); // Map of leadId -> userLead data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    highPriority: 0,
    activeThisWeek: 0
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const leadsPerPage = 50;

  // Filter state
  const [filters, setFilters] = useState({
    companies: new Set(),
    locations: new Set(),
    industries: new Set(),
    teams: new Set(),
    priorities: new Set(),
    saved: false // true = show only saved, false = show all
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Collapsible state for filter groups
  const [collapsed, setCollapsed] = useState({
    locations: true,
    companies: true,
    industries: true,
    teams: true,
    priorities: true,
    saved: true
  });

  const toggleCollapse = (category) => {
    setCollapsed(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Re-fetch leads on mount and when location changes
  useEffect(() => {
    fetchLeads();
  }, [location]); // Re-run when location object changes (including state)

  // Reset to page 1 when filters or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      // Fetch all leads for client-side filtering and pagination
      const response = await api.leads.getAll({ page: 1, limit: 10000 });
      setLeads(response.leads || []);
      setTotalLeads(response.totalLeads || 0);
      setTotalPages(Math.ceil((response.totalLeads || 0) / leadsPerPage));

      // Fetch saved leads to know which ones are already saved
      const userLeadsResponse = await api.userLeads.getAll();
      const savedLeadIds = new Set(
        userLeadsResponse.map(ul => ul.leadId?._id || ul.leadId).filter(Boolean)
      );
      setSavedLeads(savedLeadIds);

      // Create a map of leadId -> userLead for easy lookup
      const userLeadsMapping = new Map();
      userLeadsResponse.forEach(ul => {
        const leadId = ul.leadId?._id || ul.leadId;
        if (leadId) {
          userLeadsMapping.set(leadId, ul);
        }
      });
      setUserLeadsMap(userLeadsMapping);

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
        leadId
      });
      // Update saved leads set
      setSavedLeads(prev => new Set([...prev, leadId]));
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

  // Get unique values for filters
  const uniqueCompanies = [...new Set(leads.map(l => l.company).filter(Boolean))].sort();

  // Sort locations with "Remote" at the top
  const uniqueLocations = [...new Set(leads.map(l => l.location).filter(Boolean))].sort((a, b) => {
    const aIsRemote = a.toLowerCase().includes('remote');
    const bIsRemote = b.toLowerCase().includes('remote');

    if (aIsRemote && !bIsRemote) return -1;
    if (!aIsRemote && bIsRemote) return 1;
    return a.localeCompare(b);
  });

  const uniqueIndustries = [...new Set(leads.map(l => l.industry).filter(Boolean))].sort();
  const uniqueTeams = [...new Set(leads.map(l => l.team).filter(Boolean))].sort();

  // Toggle filter
  const toggleFilter = (category, value) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      const categorySet = new Set(newFilters[category]);

      if (categorySet.has(value)) {
        categorySet.delete(value);
      } else {
        categorySet.add(value);
      }

      newFilters[category] = categorySet;
      return newFilters;
    });
  };

  // Toggle saved filter
  const toggleSavedFilter = () => {
    setFilters(prev => ({
      ...prev,
      saved: !prev.saved
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      companies: new Set(),
      locations: new Set(),
      industries: new Set(),
      teams: new Set(),
      priorities: new Set(),
      saved: false
    });
  };

  // Apply filters and sort
  const filteredAndSortedLeads = [...leads]
    .filter(lead => {
      // Check search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          lead.title?.toLowerCase().includes(query) ||
          lead.company?.toLowerCase().includes(query) ||
          lead.location?.toLowerCase().includes(query);

        if (!matchesSearch) return false;
      }

      // Check saved filter
      if (filters.saved && !savedLeads.has(lead._id)) {
        return false;
      }

      // Check if any filters are active
      const hasActiveFilters =
        filters.companies.size > 0 ||
        filters.locations.size > 0 ||
        filters.industries.size > 0 ||
        filters.teams.size > 0 ||
        filters.priorities.size > 0;

      if (!hasActiveFilters) return true;

      // Check each filter category
      const matchesCompany = filters.companies.size === 0 || filters.companies.has(lead.company);
      const matchesLocation = filters.locations.size === 0 || filters.locations.has(lead.location);
      const matchesIndustry = filters.industries.size === 0 || filters.industries.has(lead.industry);
      const matchesTeam = filters.teams.size === 0 || filters.teams.has(lead.team);

      // Check priority filter
      const userLead = userLeadsMap.get(lead._id);
      const matchesPriority = filters.priorities.size === 0 ||
        (userLead?.priority && filters.priorities.has(userLead.priority));

      return matchesCompany && matchesLocation && matchesIndustry && matchesTeam && matchesPriority;
    })
    .sort((a, b) => {
      const aIsSaved = savedLeads.has(a._id);
      const bIsSaved = savedLeads.has(b._id);

      // If one is saved and the other isn't, saved comes first
      if (aIsSaved && !bIsSaved) return -1;
      if (!aIsSaved && bIsSaved) return 1;

      // If both have same saved status, sort by date posted (newest first)
      const aDate = a.datePosted ? new Date(a.datePosted) : new Date(0);
      const bDate = b.datePosted ? new Date(b.datePosted) : new Date(0);
      return bDate - aDate;
    });

  // Check if any saved leads have a priority set
  const hasPriorities = Array.from(userLeadsMap.values()).some(ul => ul.priority);

  // Calculate pagination for filtered results
  const filteredTotalPages = Math.ceil(filteredAndSortedLeads.length / leadsPerPage);
  const startIndex = (currentPage - 1) * leadsPerPage;
  const endIndex = startIndex + leadsPerPage;
  const paginatedLeads = filteredAndSortedLeads.slice(startIndex, endIndex);

  return (
    <div className="container">
      <div className="main">
        <div className="page-title">Leads</div>

        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search by position, company, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="stats">
          <span>{stats.total} leads</span>
          <span>{stats.highPriority} high priority</span>
          <span>{stats.activeThisWeek} active this week</span>
        </div>

        <div className="actions">
          <button onClick={fetchLeads}>Refresh leads</button>
          <Link to="/leads/new" className="btn-add-lead">Add Lead</Link>
        </div>

        <div className="leads-content">
          <div className="filter-sidebar">
            <div className="filter-section">
              <div className="filter-header">
                <div className="filter-title">Filters</div>
                <button className="clear-filters-btn" onClick={clearAllFilters}>
                  Clear All
                </button>
              </div>

              {/* Saved Filter */}
              <div className="filter-group">
                <div
                  className="filter-group-header"
                  onClick={() => toggleCollapse('saved')}
                >
                  <span className="filter-group-title">Saved</span>
                  <span className="collapse-icon">{collapsed.saved ? '+' : '−'}</span>
                </div>
                {!collapsed.saved && (
                  <div className="filter-group-content">
                    <label className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={filters.saved}
                        onChange={toggleSavedFilter}
                      />
                      <span>Saved Jobs Only</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Priority Filter */}
              {hasPriorities && (
                <div className="filter-group">
                  <div
                    className="filter-group-header"
                    onClick={() => toggleCollapse('priorities')}
                  >
                    <span className="filter-group-title">Priority</span>
                    <span className="collapse-icon">{collapsed.priorities ? '+' : '−'}</span>
                  </div>
                  {!collapsed.priorities && (
                    <div className="filter-group-content">
                      {['high', 'medium', 'low'].map(priority => (
                        <label key={priority} className="filter-checkbox">
                          <input
                            type="checkbox"
                            checked={filters.priorities.has(priority)}
                            onChange={() => toggleFilter('priorities', priority)}
                          />
                          <span style={{ textTransform: 'capitalize' }}>{priority}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="filter-group">
                <div
                  className="filter-group-header"
                  onClick={() => toggleCollapse('teams')}
                >
                  <span className="filter-group-title">Team</span>
                  <span className="collapse-icon">{collapsed.teams ? '+' : '−'}</span>
                </div>
                {!collapsed.teams && (
                  <div className="filter-group-content">
                    {uniqueTeams.map(team => (
                      <label key={team} className="filter-checkbox">
                        <input
                          type="checkbox"
                          checked={filters.teams.has(team)}
                          onChange={() => toggleFilter('teams', team)}
                        />
                        <span>{team}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="filter-group">
                <div
                  className="filter-group-header"
                  onClick={() => toggleCollapse('locations')}
                >
                  <span className="filter-group-title">Location</span>
                  <span className="collapse-icon">{collapsed.locations ? '+' : '−'}</span>
                </div>
                {!collapsed.locations && (
                  <div className="filter-group-content">
                    {uniqueLocations.map(location => (
                      <label key={location} className="filter-checkbox">
                        <input
                          type="checkbox"
                          checked={filters.locations.has(location)}
                          onChange={() => toggleFilter('locations', location)}
                        />
                        <span>{location}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="filter-group">
                <div
                  className="filter-group-header"
                  onClick={() => toggleCollapse('companies')}
                >
                  <span className="filter-group-title">Company</span>
                  <span className="collapse-icon">{collapsed.companies ? '+' : '−'}</span>
                </div>
                {!collapsed.companies && (
                  <div className="filter-group-content">
                    {uniqueCompanies.map(company => (
                      <label key={company} className="filter-checkbox">
                        <input
                          type="checkbox"
                          checked={filters.companies.has(company)}
                          onChange={() => toggleFilter('companies', company)}
                        />
                        <span>{company}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="filter-group">
                <div
                  className="filter-group-header"
                  onClick={() => toggleCollapse('industries')}
                >
                  <span className="filter-group-title">Industry</span>
                  <span className="collapse-icon">{collapsed.industries ? '+' : '−'}</span>
                </div>
                {!collapsed.industries && (
                  <div className="filter-group-content">
                    {uniqueIndustries.map(industry => (
                      <label key={industry} className="filter-checkbox">
                        <input
                          type="checkbox"
                          checked={filters.industries.has(industry)}
                          onChange={() => toggleFilter('industries', industry)}
                        />
                        <span>{industry}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>


            </div>
          </div>

          <div className="leads-table-container">
            <table className="leads-table">
              <thead>
                <tr>
                  {hasPriorities && <th>Priority</th>}
                  <th>Position</th>
                  <th>Company</th>
                  <th>Location</th>
                  <th>Team</th>
                  <th>Compensation</th>
                  <th>Date Posted</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeads.map((lead) => {
                  const userLead = userLeadsMap.get(lead._id);
                  return (
                    <tr key={lead._id}>
                      {hasPriorities && (
                        <td>
                          {userLead?.priority ? (
                            <span className={`priority-badge priority-${userLead.priority}`}>
                              {userLead.priority}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      )}
                      <td>
                        <Link to={`/leads/${lead._id}`} className="position-link">
                          {lead.title}
                        </Link>
                      </td>
                      <td>{lead.company}</td>
                      <td>{lead.location}</td>
                      <td>{lead.team || 'N/A'}</td>
                      <td>
                        <span className="comp">
                          {lead.compensation?.raw ||
                            (lead.compensation?.min && lead.compensation?.max
                              ? `$${lead.compensation.min}-$${lead.compensation.max}`
                              : 'N/A')}
                        </span>
                      </td>
                      <td>
                        {lead.datePosted ? new Date(lead.datePosted).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>{lead.contactName || 'N/A'}</td>
                      <td>{lead.contactEmail || 'N/A'}</td>
                      <td>
                        {savedLeads.has(lead._id) ? (
                          <button className="action-btn saved" disabled>
                            Saved
                          </button>
                        ) : (
                          <button
                            className="action-btn"
                            onClick={() => handleSaveLead(lead._id)}
                          >
                            Save
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredAndSortedLeads.length === 0 && leads.length > 0 && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>No leads match the selected filters.</p>
              </div>
            )}

            {leads.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>No leads found. Import your CSV to get started!</p>
              </div>
            )}

            {/* Pagination Controls */}
            {filteredTotalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {filteredTotalPages} ({filteredAndSortedLeads.length} results)
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.min(filteredTotalPages, prev + 1))}
                  disabled={currentPage === filteredTotalPages}
                >
                  Next
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(filteredTotalPages)}
                  disabled={currentPage === filteredTotalPages}
                >
                  Last
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leads;
