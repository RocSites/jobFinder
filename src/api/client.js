const API_URL = import.meta.env.VITE_API_URL || '/.netlify/functions';

// Helper function for API calls
const fetchAPI = async (endpoint, options = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
};

// Leads API
export const leadsAPI = {
  // Get all leads with optional filters
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchAPI(`/leads${queryString ? `?${queryString}` : ''}`);
  },

  // Get single lead by ID
  getById: (id) => fetchAPI(`/leads?id=${id}`),

  // Create new lead
  create: (data) => fetchAPI('/leads', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update lead
  update: (id, data) => fetchAPI(`/leads?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete lead
  delete: (id) => fetchAPI(`/leads?id=${id}`, {
    method: 'DELETE',
  }),
};

// User Leads API (Saved/Tracked Leads)
export const userLeadsAPI = {
  // Get all user's saved leads
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchAPI(`/user-leads${queryString ? `?${queryString}` : ''}`);
  },

  // Get pipeline view (grouped by status)
  getPipeline: (userId = '') => {
    const query = userId ? `?userId=${userId}` : '';
    return fetchAPI(`/pipeline${query}`);
  },

  // Get single user lead by UserLead ID
  getById: (id, userId = '') => {
    const params = new URLSearchParams({ id });
    if (userId) params.append('userId', userId);
    return fetchAPI(`/user-leads?${params.toString()}`);
  },

  // Get user lead by LEAD ID (not UserLead ID) - NEW!
  getByLeadId: (leadId, userId = '') => {
    const params = new URLSearchParams({ leadId });
    if (userId) params.append('userId', userId);
    return fetchAPI(`/user-leads?${params.toString()}`);
  },

  // Get activity timeline for a lead
  getActivity: (id, userId = '') => {
    const params = new URLSearchParams({ id, activity: 'true' });
    if (userId) params.append('userId', userId);
    return fetchAPI(`/user-leads?${params.toString()}`);
  },

  // Save a lead
  save: (data) => fetchAPI('/user-leads', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update user lead (priority, notes, etc.)
  update: (id, data) => fetchAPI(`/user-leads?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Update pipeline status
  updateStatus: (id, status, note = '') => fetchAPI(`/user-leads?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status, note }),
  }),

  // Remove saved lead
  remove: (id, userId = '') => {
    const params = new URLSearchParams({ id });
    if (userId) params.append('userId', userId);
    return fetchAPI(`/user-leads?${params.toString()}`, {
      method: 'DELETE',
    });
  },
};

// Export combined API object
export const api = {
  leads: leadsAPI,
  userLeads: userLeadsAPI,
};

export default api;
