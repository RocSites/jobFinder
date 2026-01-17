import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side validation
const getSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase environment variables not configured');
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

/**
 * Verify JWT token from Authorization header
 * @param {string} authHeader - The Authorization header value
 * @returns {Object|null} - User object with id, email, role or null if invalid
 */
export const verifyToken = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Verify the JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log('Token verification failed:', error?.message);
      return null;
    }

    // Get user profile for role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log('Profile fetch error:', profileError.message);
    }

    return {
      id: user.id,
      email: user.email,
      role: profile?.role || 'user'
    };
  } catch (err) {
    console.error('Auth verification error:', err);
    return null;
  }
};

/**
 * Middleware helper to require authentication
 * @param {Object} event - Netlify function event
 * @returns {Object} - { user: Object|null, error: Object|null }
 */
export const requireAuth = async (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const user = await verifyToken(authHeader);

  if (!user) {
    return {
      user: null,
      error: {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' })
      }
    };
  }

  return { user, error: null };
};

/**
 * Optional authentication - returns user if authenticated, null otherwise
 * @param {Object} event - Netlify function event
 * @returns {Object|null} - User object or null
 */
export const optionalAuth = async (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  return await verifyToken(authHeader);
};

/**
 * Check if user is admin
 * @param {Object} user - User object from verifyToken
 * @returns {boolean}
 */
export const isAdmin = (user) => {
  return user?.role === 'admin';
};

export { getSupabaseClient };
