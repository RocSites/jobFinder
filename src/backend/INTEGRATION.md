# JobFinder - Complete MongoDB + API Integration

## 📁 Project Structure

```
jobfinder/
├── jobfinder-backend/           # New backend API
│   ├── config/
│   │   └── db.js                # MongoDB connection
│   ├── models/
│   │   ├── Lead.js              # Lead schema
│   │   ├── UserLead.js          # User lead tracking schema
│   │   ├── Message.js           # Messages schema
│   │   └── Activity.js          # Activity log schema
│   ├── controllers/
│   │   ├── leadController.js    # Lead business logic
│   │   └── userLeadController.js # User lead business logic
│   ├── routes/
│   │   ├── leadRoutes.js        # Lead API routes
│   │   └── userLeadRoutes.js    # User lead API routes
│   ├── utils/
│   │   └── helpers.js           # Utility functions
│   ├── scripts/
│   │   └── importLeads.js       # CSV import script
│   ├── frontend-integration/    # Updated React components
│   │   ├── api-client.js        # API client for React
│   │   ├── Leads-updated.jsx
│   │   ├── Pipeline-updated.jsx
│   │   └── LeadDetail-updated.jsx
│   ├── server.js                # Express server
│   ├── package.json
│   ├── .env.example
│   ├── .gitignore
│   ├── README.md
│   └── SETUP.md
│
└── jobfinder-main/              # Your existing React frontend
    ├── src/
    │   ├── api/
    │   │   └── client.js        # Copy from frontend-integration/
    │   ├── pages/
    │   │   ├── Leads.jsx        # Update with Leads-updated.jsx
    │   │   ├── Pipeline.jsx     # Update with Pipeline-updated.jsx
    │   │   └── LeadDetail.jsx   # Update with LeadDetail-updated.jsx
    │   └── ...
    └── ...
```

## 🗄️ Database Architecture

### Collections

1. **leads** - Master job lead data (shared across all users)
2. **userleads** - User-specific tracking (who saved what, with what priority/status)
3. **messages** - Communications related to leads
4. **activities** - Activity log for tracking changes

### Data Flow

```
User Views Leads
    ↓
GET /api/leads
    ↓
Returns all available leads
    ↓
User clicks "Save"
    ↓
POST /api/user-leads
    ↓
Creates UserLead record
    ↓
User sees in Pipeline
    ↓
GET /api/user-leads/pipeline
    ↓
Returns leads grouped by status
```

## 🔄 Key Workflows

### 1. Viewing All Leads

```javascript
// Frontend
const { leads } = await api.leads.getAll({ search: 'engineer', industry: 'tech' });

// Backend
// GET /api/leads?search=engineer&industry=tech
// Returns: { leads: [...], totalPages, currentPage, totalLeads }
```

### 2. Saving a Lead

```javascript
// Frontend
await api.userLeads.save({
  leadId: '507f1f77bcf86cd799439011',
  priority: 'high',
  notes: 'Great opportunity'
});

// Backend
// POST /api/user-leads
// Creates UserLead + logs activity
// Status automatically set to 'saved'
```

### 3. Moving Through Pipeline

```javascript
// Frontend
await api.userLeads.updateStatus('userLeadId', 'applied', 'Submitted via portal');

// Backend
// PUT /api/user-leads/:id/status
// Validates transition
// Updates status + statusHistory
// Sets appliedAt timestamp
// Logs activity
```

### 4. Viewing Pipeline

```javascript
// Frontend
const pipeline = await api.userLeads.getPipeline();

// Backend
// GET /api/user-leads/pipeline
// Returns:
// [
//   { _id: 'saved', leads: [...], count: 5 },
//   { _id: 'applied', leads: [...], count: 3 },
//   { _id: 'interviewing', leads: [...], count: 2 },
//   { _id: 'offer', leads: [...], count: 1 }
// ]
```

## 📊 Status Flow Validation

The backend enforces valid status transitions:

```
saved → applied, rejected, archived
applied → interviewing, rejected, archived
interviewing → offer, rejected, archived
offer → archived
rejected → archived
archived → [terminal state]
```

Attempting an invalid transition (e.g., `saved` → `offer`) will return a 400 error.

## 🎯 API Endpoints Summary

### Leads (Master Data)
- `GET /api/leads` - List all leads (with filters)
- `GET /api/leads/:id` - Get single lead
- `POST /api/leads` - Create lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### User Leads (Tracking)
- `GET /api/user-leads` - List user's saved leads
- `GET /api/user-leads/pipeline` - Pipeline view
- `GET /api/user-leads/:id` - Get single user lead
- `GET /api/user-leads/:id/activity` - Get activity log
- `POST /api/user-leads` - Save a lead
- `PUT /api/user-leads/:id` - Update (priority, notes)
- `PUT /api/user-leads/:id/status` - Update status
- `DELETE /api/user-leads/:id` - Remove from pipeline

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Your 600 leads in CSV format

### Installation

1. **Setup Backend:**
```bash
cd jobfinder-backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run dev
```

2. **Import Leads:**
```bash
npm run import-leads path/to/your-leads.csv
```

3. **Update Frontend:**
```bash
cd ../jobfinder-main

# Create .env
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Copy API client
mkdir -p src/api
cp ../jobfinder-backend/frontend-integration/api-client.js src/api/client.js

# Update components
cp ../jobfinder-backend/frontend-integration/Leads-updated.jsx src/pages/Leads.jsx
cp ../jobfinder-backend/frontend-integration/Pipeline-updated.jsx src/pages/Pipeline.jsx
cp ../jobfinder-backend/frontend-integration/LeadDetail-updated.jsx src/pages/LeadDetail.jsx

npm run dev
```

## 🎨 Frontend Changes Required

### 1. Add API Client
- Copy `api-client.js` to `src/api/client.js`

### 2. Update Components
- Replace mock data with API calls
- Add loading states
- Add error handling
- Add form submissions

### 3. Add Environment Variable
- Create `.env` with `VITE_API_URL=http://localhost:5000/api`

## 🧪 Testing

### Backend Tests

```bash
# Health check
curl http://localhost:5000/api/health

# Get leads
curl http://localhost:5000/api/leads

# Get pipeline
curl http://localhost:5000/api/user-leads/pipeline

# Save a lead
curl -X POST http://localhost:5000/api/user-leads \
  -H "Content-Type: application/json" \
  -d '{"leadId":"LEAD_ID_HERE","priority":"high"}'
```

### Frontend Tests
1. Open http://localhost:5173
2. Navigate to Leads page - should fetch from API
3. Click "Save" on a lead - should create UserLead
4. Go to Pipeline page - should show saved lead
5. Click status buttons - should update status

## 📝 CSV Import Format

Your CSV needs at minimum:
- **title** (or position, job_title)
- **company** (or company_name)

Optional but recommended:
- location
- compensation / salary
- contactName / contact_name
- contactEmail / contact_email
- industry
- datePosted / date_posted

See `example-leads.csv` for reference.

## 🔐 Authentication (Future)

Currently using `DEFAULT_USER_ID` from .env. To add authentication:

1. Add auth middleware
2. Extract userId from JWT token
3. Pass to controllers
4. Update frontend to send auth headers

## 🎯 Next Steps

### Immediate
- [ ] Import your 600 leads
- [ ] Test basic CRUD operations
- [ ] Verify pipeline status changes
- [ ] Test filtering and search

### Short-term
- [ ] Add user authentication
- [ ] Add email integration for messages
- [ ] Add file upload for resumes
- [ ] Add analytics dashboard

### Long-term
- [ ] Add real-time updates (WebSockets)
- [ ] Add collaborative features
- [ ] Add AI-powered recommendations
- [ ] Add calendar integration

## 🐛 Troubleshooting

**MongoDB connection fails:**
- Check if MongoDB is running
- Verify MONGODB_URI in .env
- For Atlas, whitelist your IP

**CORS errors:**
- Backend configured for all origins in dev
- For production, update server.js

**Import script fails:**
- Check CSV encoding (should be UTF-8)
- Verify column names
- Check for malformed rows

**Frontend can't fetch data:**
- Check backend is running on port 5000
- Verify VITE_API_URL in frontend .env
- Check browser console for errors

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Guide](https://mongoosejs.com/docs/guide.html)
- [Express Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)

## 💡 Tips

1. **Development**: Run both backend and frontend simultaneously
2. **Database**: Use MongoDB Compass to visualize data
3. **Debugging**: Check terminal logs for both servers
4. **CSV Import**: Start with small test file first
5. **Testing**: Use Postman or curl to test API endpoints

## 🤝 Support

If you encounter issues:
1. Check the logs in both terminals
2. Verify MongoDB is running
3. Check .env files are configured correctly
4. Ensure ports 5000 (backend) and 5173 (frontend) are available

Good luck with your job search! 🎉
