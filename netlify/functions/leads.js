// netlify/functions/leads.js
import { MongoClient, ObjectId } from 'mongodb';
import { optionalAuth, requireAuth, isAdmin } from './utils/auth.js';

let cachedDb;

const connectDB = async () => {
  if (cachedDb) return cachedDb;
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  cachedDb = client.db(process.env.MONGODB_DB_NAME || 'nextgig2');
  return cachedDb;
};

export const handler = async (event) => {
  const db = await connectDB();
  const collection = db.collection('leads');

  try {
    const { id } = event.queryStringParameters || {};

    // GET - Leads can be viewed by anyone authenticated
    // Users see: global leads + their own created leads
    if (event.httpMethod === 'GET') {
      const user = await optionalAuth(event);

      if (id) {
        const lead = await collection.findOne({ _id: new ObjectId(id) });

        // If lead exists, check if user can access it
        if (lead && user) {
          // User can see global leads or leads they created
          if (!lead.isGlobal && lead.createdBy !== user.id && lead.createdBy !== 'system') {
            return { statusCode: 404, body: JSON.stringify({ error: 'Lead not found' }) };
          }
        }

        return { statusCode: 200, body: JSON.stringify(lead) };
      }

      // Parse query parameters for pagination and sorting
      const { page = '1', limit = '10', sort = '-_id', search } = event.queryStringParameters || {};
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      // Parse sort parameter (e.g., '-_id' means descending by ObjectId/creation time)
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortOrder = sort.startsWith('-') ? -1 : 1;
      const sortObj = { [sortField]: sortOrder };

      // Build query - users see global leads + their own created leads
      let query = {};
      if (user) {
        query = {
          $or: [
            { isGlobal: true },
            { createdBy: 'system' }, // Legacy/imported leads
            { createdBy: user.id }
          ]
        };
      } else {
        // Unauthenticated users only see global leads
        query = {
          $or: [
            { isGlobal: true },
            { createdBy: 'system' }
          ]
        };
      }

      // Add search filter if provided
      if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        query = {
          $and: [
            query,
            {
              $or: [
                { title: searchRegex },
                { company: searchRegex },
                { location: searchRegex }
              ]
            }
          ]
        };
      }

      // Get total count for pagination
      const totalLeads = await collection.countDocuments(query);

      // Fetch leads with pagination and sorting
      const allLeads = await collection
        .find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .toArray();

      return {
        statusCode: 200,
        body: JSON.stringify({
          leads: allLeads,
          totalLeads,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalLeads / limitNum)
        })
      };
    }

    // POST - Create lead (requires auth)
    if (event.httpMethod === 'POST') {
      const { user, error } = await requireAuth(event);
      if (error) return error;

      const data = JSON.parse(event.body);

      // Set createdBy and isGlobal based on user role
      const leadData = {
        ...data,
        createdBy: user.id,
        isGlobal: isAdmin(user), // Admin-created leads are global
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await collection.insertOne(leadData);
      const insertedDoc = await collection.findOne({ _id: result.insertedId });
      return { statusCode: 201, body: JSON.stringify(insertedDoc) };
    }

    // PUT - Update lead (requires auth, can only update own leads or admin)
    if (event.httpMethod === 'PUT') {
      if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing ID' }) };

      const { user, error } = await requireAuth(event);
      if (error) return error;

      // Check if user can edit this lead
      const existing = await collection.findOne({ _id: new ObjectId(id) });
      if (!existing) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Lead not found' }) };
      }

      // Only creator or admin can update
      if (existing.createdBy !== user.id && existing.createdBy !== 'system' && !isAdmin(user)) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Not authorized to edit this lead' }) };
      }

      const updates = JSON.parse(event.body);
      // Don't allow changing createdBy or isGlobal unless admin
      if (!isAdmin(user)) {
        delete updates.createdBy;
        delete updates.isGlobal;
      }

      updates.updatedAt = new Date().toISOString();

      await collection.updateOne({ _id: new ObjectId(id) }, { $set: updates });
      const updated = await collection.findOne({ _id: new ObjectId(id) });
      return { statusCode: 200, body: JSON.stringify(updated) };
    }

    // DELETE - Delete lead (requires auth, can only delete own leads or admin)
    if (event.httpMethod === 'DELETE') {
      if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing ID' }) };

      const { user, error } = await requireAuth(event);
      if (error) return error;

      // Check if user can delete this lead
      const existing = await collection.findOne({ _id: new ObjectId(id) });
      if (!existing) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Lead not found' }) };
      }

      // Only creator or admin can delete
      if (existing.createdBy !== user.id && !isAdmin(user)) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Not authorized to delete this lead' }) };
      }

      await collection.deleteOne({ _id: new ObjectId(id) });
      return { statusCode: 204, body: '' };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (err) {
    console.error('leads error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
