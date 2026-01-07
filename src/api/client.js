// API client for JobFinder backend
// Place this in: src/api/client.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
  getById: (id) => fetchAPI(`/leads/${id}`),

  // Create new lead
  create: (data) => fetchAPI('/leads', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update lead
  update: (id, data) => fetchAPI(`/leads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete lead
  delete: (id) => fetchAPI(`/leads/${id}`, {
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
    return fetchAPI(`/user-leads/pipeline${query}`);
  },

  // Get single user lead
  getById: (id, userId = '') => {
    const query = userId ? `?userId=${userId}` : '';
    return fetchAPI(`/user-leads/${id}${query}`);
  },

  // Get activity timeline for a lead
  getActivity: (id, userId = '') => {
    const query = userId ? `?userId=${userId}` : '';
    return fetchAPI(`/user-leads/${id}/activity${query}`);
  },

  // Save a lead
  save: (data) => fetchAPI('/user-leads', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update user lead (priority, notes, etc.)
  update: (id, data) => fetchAPI(`/user-leads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Update pipeline status
  updateStatus: (id, status, note = '') => fetchAPI(`/user-leads/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, note }),
  }),

  // Remove saved lead
  remove: (id, userId = '') => {
    const query = userId ? `?userId=${userId}` : '';
    return fetchAPI(`/user-leads/${id}${query}`, {
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
