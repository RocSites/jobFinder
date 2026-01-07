# Quick Setup Guide

## 1. Backend Setup

```bash
# Navigate to backend folder
cd jobfinder-backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your MongoDB connection string
# For local: MONGODB_URI=mongodb://localhost:27017/jobfinder
# For Atlas: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jobfinder

# Start MongoDB (if using local)
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongodb
# Windows: Start MongoDB service from Services

# Import your leads CSV
npm run import-leads path/to/your-leads.csv

# Start the server
npm run dev
```

Server will run on http://localhost:5000

## 2. Frontend Setup

```bash
# Navigate to your React app
cd jobfinder-main

# Create .env file for frontend
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Copy the API client
cp ../jobfinder-backend/frontend-integration/api-client.js src/api/client.js

# Replace your existing components with the updated ones
cp ../jobfinder-backend/frontend-integration/Leads-updated.jsx src/pages/Leads.jsx
cp ../jobfinder-backend/frontend-integration/Pipeline-updated.jsx src/pages/Pipeline.jsx
cp ../jobfinder-backend/frontend-integration/LeadDetail-updated.jsx src/pages/LeadDetail.jsx

# Start the dev server
npm run dev
```

## 3. Test the Integration

1. **Check Backend Health:**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **View Leads:**
   ```bash
   curl http://localhost:5000/api/leads
   ```

3. **Open Frontend:**
   Navigate to http://localhost:5173 (or your Vite port)

## 4. Common Issues

**MongoDB Connection Failed:**
- Make sure MongoDB is running
- Check your MONGODB_URI in .env
- For Atlas, check IP whitelist settings

**CORS Errors:**
- Backend is configured to allow all origins in development
- For production, update CORS settings in server.js

**Port Already in Use:**
- Change PORT in backend .env
- Or kill the process: `lsof -ti:5000 | xargs kill`

## 5. CSV Format for Import

Your CSV should have these columns (names can vary):

```csv
title,company,location,team,compensation,contactName,contactEmail,sourceLink,sourceApplicationLink,datePosted,industry
Software Engineer,Apple,Remote,Engineering,150000-175000,John Doe,john@apple.com,https://linkedin.com/jobs/123,https://apple.com/careers/123,01/06/2026,Technology
Product Manager,Google,San Francisco,Product,180000-220000,Jane Smith,jane@google.com,https://linkedin.com/jobs/456,https://careers.google.com/456,01/05/2026,Technology
```

The import script is flexible and will try variations like:
- title / position / job_title
- company / company_name
- contactName / contact_name / hiring_manager
- etc.

## 6. Next Steps

- Test CRUD operations in the UI
- Test pipeline status changes
- Add more leads via the API or CSV import
- Customize the components to match your design

## 7. Development Workflow

**Terminal 1 - Backend:**
```bash
cd jobfinder-backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd jobfinder-main
npm run dev
```

Both will auto-reload on file changes.
