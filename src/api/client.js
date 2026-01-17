const API_URL = import.meta.env.VITE_API_URL || '/.netlify/functions';

// Store access token at module level - set by AuthContext
let cachedAccessToken = null;

// Function to update the cached token (called from AuthContext)
export const setAccessToken = (token) => {
  cachedAccessToken = token;
};

// Get auth headers using cached token
const getAuthHeaders = () => {
  if (cachedAccessToken) {
    return { Authorization: `Bearer ${cachedAccessToken}` };
  }
  return {};
};

// Helper function for API calls with auth
const fetchAPI = async (endpoint, options = {}) => {
  const authHeaders = getAuthHeaders();

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'API request failed');
  }

  // 204 No Content responses have no body
  if (response.status === 204) {
    return null;
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

// Publish Leads API
export const publishLeadsAPI = {
  // Publish a single lead to public database
  publishSingle: (leadId) => fetchAPI('/publish-leads', {
    method: 'POST',
    body: JSON.stringify({ mode: 'single', leadId }),
  }),

  // Publish all user's leads to public database
  publishAll: () => fetchAPI('/publish-leads', {
    method: 'POST',
    body: JSON.stringify({ mode: 'all' }),
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
  getPipeline: () => fetchAPI('/pipeline'),

  // Get single user lead by UserLead ID
  getById: (id) => {
    const params = new URLSearchParams({ id });
    return fetchAPI(`/user-leads?${params.toString()}`);
  },

  // Get user lead by LEAD ID (not UserLead ID)
  getByLeadId: (leadId) => {
    const params = new URLSearchParams({ leadId });
    return fetchAPI(`/user-leads?${params.toString()}`);
  },

  // Get activity timeline for a lead
  getActivity: (id) => {
    const params = new URLSearchParams({ id, activity: 'true' });
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
  remove: (id) => {
    const params = new URLSearchParams({ id });
    return fetchAPI(`/user-leads?${params.toString()}`, {
      method: 'DELETE',
    });
  },
};

// Referrals API
export const referralsAPI = {
  // Get all referrals
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchAPI(`/referrals${queryString ? `?${queryString}` : ''}`);
  },

  // Get single referral by ID
  getById: (id) => fetchAPI(`/referrals?id=${id}`),

  // Get activity timeline for a referral
  getActivity: (id) => {
    const params = new URLSearchParams({ id, activity: 'true' });
    return fetchAPI(`/referrals?${params.toString()}`);
  },

  // Create new referral
  create: (data) => fetchAPI('/referrals', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update referral
  update: (id, data) => fetchAPI(`/referrals?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete referral
  delete: (id) => fetchAPI(`/referrals?id=${id}`, {
    method: 'DELETE',
  }),
};

// Export combined API object
export const api = {
  leads: leadsAPI,
  userLeads: userLeadsAPI,
  referrals: referralsAPI,
  publish: publishLeadsAPI,
};

export default api;
