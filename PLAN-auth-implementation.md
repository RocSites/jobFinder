# Authentication Implementation Plan

## Overview
Add multi-user authentication using Supabase with invite-code signup flow.

---

## Phase 1: Supabase Setup (Manual Steps)

### 1.1 Create Supabase Project
1. Go to https://supabase.com and create account/project
2. Note down:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon (public) key: `eyJhbGc...`
   - Service role key (for backend): `eyJhbGc...`

### 1.2 Create Invite Codes Table
Run this SQL in Supabase SQL Editor:

```sql
-- Invite codes table
CREATE TABLE invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  uses_remaining INT DEFAULT 1,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Insert some initial codes (you can add more later)
INSERT INTO invite_codes (code, uses_remaining) VALUES
  ('EARLYACCESS2024', 100),
  ('BETATESTER', 50);

-- Enable RLS (Row Level Security)
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read codes (for validation)
CREATE POLICY "Anyone can validate codes" ON invite_codes
  FOR SELECT USING (true);

-- Only authenticated users can update (decrement uses)
CREATE POLICY "Authenticated users can use codes" ON invite_codes
  FOR UPDATE USING (auth.role() = 'authenticated');
```

### 1.3 Create User Profiles Table (Optional but Recommended)
```sql
-- User profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invite_code_used VARCHAR(50)
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Auto-create profile on signup (trigger)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 1.4 Set Your Admin User
After you create your admin account, run:
```sql
UPDATE user_profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID';
```

---

## Phase 2: Environment Variables

### 2.1 Local Development (.env)
```env
# Existing
VITE_API_URL=http://localhost:8888/.netlify/functions
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=test

# New - Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Backend only, never expose
```

### 2.2 Netlify Environment Variables
Add these in Netlify Dashboard → Site Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Phase 3: Backend Changes

### 3.1 Update Lead Model
Add `createdBy` field to track who created each lead:

```javascript
// src/backend/models/Lead.js
const leadSchema = new mongoose.Schema({
  // ... existing fields ...
  createdBy: {
    type: String,  // Supabase user ID or 'admin' or 'system'
    default: 'system',
    index: true
  },
  isGlobal: {
    type: Boolean,
    default: false,  // true = visible to all users
    index: true
  }
});
```

### 3.2 Create Auth Middleware for Netlify Functions
New file: `netlify/functions/utils/auth.js`

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    // Get user profile for role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      role: profile?.role || 'user'
    };
  } catch (err) {
    console.error('Auth error:', err);
    return null;
  }
}

module.exports = { verifyToken, supabase };
```

### 3.3 Update Netlify Functions

**leads.js** - Modified query logic:
```javascript
// For GET requests, filter leads based on user
if (user) {
  // Show: global leads + leads created by this user
  query = {
    $or: [
      { isGlobal: true },
      { createdBy: user.id }
    ]
  };
} else {
  // Unauthenticated: only global leads
  query = { isGlobal: true };
}

// For POST (create), set createdBy
if (method === 'POST') {
  if (!user) return { statusCode: 401, body: 'Unauthorized' };

  leadData.createdBy = user.id;
  leadData.isGlobal = user.role === 'admin';  // Admin-created = global
}
```

**user-leads.js** - Require auth:
```javascript
// All user-leads operations require authentication
const user = await verifyToken(event.headers.authorization);
if (!user) {
  return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
}

// Use user.id instead of hardcoded 'user123'
const userId = user.id;
```

### 3.4 Migration Script
Create `scripts/migrate-add-createdBy.js`:

```javascript
// Mark all existing leads as global (admin-created)
db.leads.updateMany(
  { createdBy: { $exists: false } },
  { $set: { createdBy: 'system', isGlobal: true } }
);

// Keep user123's userLeads intact - they'll work with their Supabase ID
// You'll need to map user123 → your new Supabase user ID after signup
```

---

## Phase 4: Frontend Changes

### 4.1 Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### 4.2 Create Supabase Client
New file: `src/lib/supabase.js`

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 4.3 Create Auth Context
New file: `src/contexts/AuthContext.jsx`

```javascript
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, inviteCode) => {
    // Validate invite code first
    const { data: codeData, error: codeError } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', inviteCode)
      .gt('uses_remaining', 0)
      .single();

    if (codeError || !codeData) {
      throw new Error('Invalid or expired invite code');
    }

    // Sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Decrement invite code uses
    await supabase
      .from('invite_codes')
      .update({ uses_remaining: codeData.uses_remaining - 1 })
      .eq('id', codeData.id);

    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    isAdmin: user?.user_metadata?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
```

### 4.4 Update API Client
Modify `src/api/client.js` to include auth headers:

```javascript
import { supabase } from '../lib/supabase';

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
};

// Update all fetch calls to include auth headers
const fetchWithAuth = async (url, options = {}) => {
  const authHeaders = await getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...authHeaders,
    },
  });
};
```

### 4.5 Create Auth Pages

**src/pages/Login.jsx**
- Email/password form
- Link to signup
- "Forgot password" link

**src/pages/Signup.jsx**
- Invite code input (first step)
- Email/password form (after valid code)
- Link to login

### 4.6 Update App.jsx Routes

```javascript
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/:leadId" element={<LeadDetail />} />
          {/* ... other routes */}
        </Route>
      </Routes>
    </AuthProvider>
  );
}
```

### 4.7 Create ProtectedRoute Component

```javascript
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return <Outlet />;
};
```

---

## Phase 5: Data Migration Strategy

### 5.1 Before Deployment
1. Create your admin account in Supabase
2. Note your Supabase user ID
3. Run migration to mark existing leads as global

### 5.2 Preserving user123 Data
Option A: **Map user123 to your Supabase ID**
```javascript
// One-time migration after you create your admin account
db.userLeads.updateMany(
  { userId: 'user123' },
  { $set: { userId: 'YOUR_SUPABASE_USER_ID' } }
);
db.activities.updateMany(
  { userId: 'user123' },
  { $set: { userId: 'YOUR_SUPABASE_USER_ID' } }
);
```

Option B: **Keep user123 as legacy** (less clean but safer)
- Create a special case in backend that maps your Supabase ID to user123
- Not recommended long-term

---

## Phase 6: Testing Checklist

- [ ] Signup with valid invite code works
- [ ] Signup with invalid code shows error
- [ ] Login works
- [ ] Logout works
- [ ] Protected routes redirect to login
- [ ] User can only see their own userLeads
- [ ] User can see global leads + their own created leads
- [ ] Admin can create leads that become global
- [ ] Your existing user123 data is accessible under your new account
- [ ] API returns 401 for unauthenticated requests to protected endpoints

---

## Implementation Order

1. **Supabase Setup** (manual, ~15 min)
2. **Environment Variables** (manual, ~5 min)
3. **Backend Auth Middleware** (~30 min)
4. **Update Lead Model** (~10 min)
5. **Update Netlify Functions** (~1 hour)
6. **Frontend Supabase Client** (~10 min)
7. **Auth Context** (~30 min)
8. **Login Page** (~30 min)
9. **Signup Page** (~45 min)
10. **Protected Routes** (~15 min)
11. **Update API Client** (~20 min)
12. **Data Migration** (~15 min)
13. **Testing** (~1 hour)

**Total Estimated: ~5-6 hours**

---

## Questions/Decisions Needed

1. **Email verification?** Supabase can require email confirmation before login. Want this?
2. **Password reset flow?** Supabase has built-in. Want to implement the UI?
3. **Remember me?** Session persistence options
4. **Admin UI?** Separate admin panel or just role-based features in main UI?

---

Ready to proceed? I'll start with the backend changes and work through systematically.
