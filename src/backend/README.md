# JobFinder Backend API

MongoDB + Express backend for the JobFinder job tracking application.

## Features

- ✅ Lead management (CRUD operations)
- ✅ User-specific lead tracking
- ✅ Pipeline status management with validation
- ✅ Activity logging and history
- ✅ Priority management
- ✅ CSV import for bulk lead loading
- ✅ Advanced querying and filtering

## Tech Stack

- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your MongoDB connection string:

```env
MONGODB_URI=mongodb://localhost:27017/jobfinder
PORT=5000
NODE_ENV=development
DEFAULT_USER_ID=user123
```

**For MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jobfinder?retryWrites=true&w=majority
```

### 3. Install MongoDB (Local Development)

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Windows:**
Download from https://www.mongodb.com/try/download/community

**Or use MongoDB Atlas (Cloud):**
Sign up at https://www.mongodb.com/cloud/atlas

### 4. Import Your Leads

Place your CSV file in the backend directory, then run:

```bash
npm run import-leads path/to/your-leads.csv
```

**CSV Format:**
Your CSV should have columns matching these fields (column names can vary):
- title / position / job_title
- company / company_name
- location
- team / department
- compensation / salary / comp
- contactName / contact_name / hiring_manager
- contactEmail / contact_email / email
- sourceLink / source_link / url
- sourceApplicationLink / application_link / apply_url
- datePosted / date_posted / posted_date
- industry / sector

The import script is flexible and will try multiple column name variations.

### 5. Start the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will run on http://localhost:5000

## API Endpoints

### Leads

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leads` | Get all leads (with filtering) |
| GET | `/api/leads/:id` | Get single lead |
| POST | `/api/leads` | Create new lead |
| PUT | `/api/leads/:id` | Update lead |
| DELETE | `/api/leads/:id` | Delete lead |

**Query Parameters for GET /api/leads:**
- `search` - Search in title and company
- `industry` - Filter by industry
- `location` - Filter by location
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

### User Leads (Saved/Tracked Leads)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user-leads` | Get user's saved leads |
| GET | `/api/user-leads/pipeline` | Get pipeline view (grouped by status) |
| GET | `/api/user-leads/:id` | Get single user lead |
| GET | `/api/user-leads/:id/activity` | Get activity timeline |
| POST | `/api/user-leads` | Save a lead |
| PUT | `/api/user-leads/:id` | Update lead (priority, notes) |
| PUT | `/api/user-leads/:id/status` | Update pipeline status |
| DELETE | `/api/user-leads/:id` | Remove saved lead |

**Query Parameters:**
- `userId` - User identifier (defaults to DEFAULT_USER_ID from .env)
- `status` - Filter by status (saved, applied, interviewing, offer)
- `priority` - Filter by priority (high, medium, low)
- `sortBy` - Sort field (default: lastActivityAt)
- `order` - Sort order: asc/desc (default: desc)

## Example Requests

### Get All Leads with Search
```bash
curl "http://localhost:5000/api/leads?search=engineer&industry=software"
```

### Save a Lead
```bash
curl -X POST http://localhost:5000/api/user-leads \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "67123abc...",
    "priority": "high",
    "notes": "Great opportunity"
  }'
```

### Update Pipeline Status
```bash
curl -X PUT http://localhost:5000/api/user-leads/67123abc.../status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "applied",
    "note": "Submitted application via company portal"
  }'
```

### Get Pipeline View
```bash
curl "http://localhost:5000/api/user-leads/pipeline?userId=user123"
```

## Data Models

### Lead (Master Data)
```javascript
{
  title: String,
  company: String,
  location: String,
  team: String,
  compensation: {
    min: Number,
    max: Number,
    currency: String,
    raw: String
  },
  contactName: String,
  contactEmail: String,
  sourceLink: String,
  sourceApplicationLink: String,
  datePosted: Date,
  industry: String
}
```

### UserLead (User-Specific Tracking)
```javascript
{
  userId: String,
  leadId: ObjectId (ref: Lead),
  currentStatus: String, // saved, applied, interviewing, offer, rejected, archived
  statusHistory: [{
    status: String,
    timestamp: Date,
    note: String
  }],
  priority: String, // high, medium, low
  notes: String,
  savedAt: Date,
  appliedAt: Date,
  interviewingAt: Date,
  offerAt: Date,
  lastActivityAt: Date
}
```

## Pipeline Status Flow

Valid transitions:
- `saved` → applied, rejected, archived
- `applied` → interviewing, rejected, archived
- `interviewing` → offer, rejected, archived
- `offer` → archived
- `rejected` → archived

The API will validate status transitions and reject invalid moves.

## Development

### View Database in MongoDB Compass
1. Download MongoDB Compass: https://www.mongodb.com/products/compass
2. Connect using your MONGODB_URI
3. Browse collections: leads, userleads, activities

### Clear All Data (Use with Caution!)
```bash
mongosh jobfinder --eval "db.dropDatabase()"
```

## Connecting to Frontend

Update your React app to point to the API:

**In your React app, create an API client:**

```javascript
// src/api/client.js
const API_URL = 'http://localhost:5000/api';

export const api = {
  // Leads
  getLeads: (params) => 
    fetch(`${API_URL}/leads?${new URLSearchParams(params)}`).then(r => r.json()),
  
  getLead: (id) => 
    fetch(`${API_URL}/leads/${id}`).then(r => r.json()),
  
  // User Leads
  getUserLeads: (params) => 
    fetch(`${API_URL}/user-leads?${new URLSearchParams(params)}`).then(r => r.json()),
  
  getPipeline: () => 
    fetch(`${API_URL}/user-leads/pipeline`).then(r => r.json()),
  
  saveLead: (data) => 
    fetch(`${API_URL}/user-leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  updateStatus: (id, data) => 
    fetch(`${API_URL}/user-leads/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json())
};
```

## Troubleshooting

**Can't connect to MongoDB:**
- Check if MongoDB is running: `mongosh` or `brew services list`
- Verify MONGODB_URI in .env
- For Atlas, check firewall/IP whitelist

**Import script fails:**
- Check CSV file path
- Verify column names match expected format
- Check for encoding issues (use UTF-8)

**Port already in use:**
- Change PORT in .env
- Or kill process: `lsof -ti:5000 | xargs kill`

## Next Steps

- [ ] Add authentication (JWT)
- [ ] Add message/email integration
- [ ] Add file upload for resumes
- [ ] Add email notifications
- [ ] Add analytics endpoints
- [ ] Add rate limiting
- [ ] Add caching with Redis

## License

MIT
