// netlify/functions/user-leads.js
import { MongoClient, ObjectId } from 'mongodb';
import { requireAuth } from './utils/auth.js';

let cachedClient;
let cachedDb;

const connectDB = async () => {
  if (cachedDb) return cachedDb;
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  cachedClient = client;
  cachedDb = client.db(process.env.MONGODB_DB_NAME || 'nextgig2');
  return cachedDb;
};

export const handler = async (event) => {
  // All user-leads operations require authentication
  const { user, error } = await requireAuth(event);
  if (error) return error;

  const db = await connectDB();
  const collection = db.collection('userleads');

  try {
    const { id, leadId, activity } = event.queryStringParameters || {};
    const userId = user.id; // Use authenticated user's ID

    // GET requests
    if (event.httpMethod === 'GET') {
      // /user-leads/by-lead
      if (leadId) {
        const query = { leadId: new ObjectId(leadId), userId };
        const userLead = await collection.findOne(query);
        return { statusCode: 200, body: JSON.stringify(userLead) };
      }

      // /user-leads/:id/activity
      if (activity === 'true' && id) {
        // Verify user owns this lead
        const lead = await collection.findOne({ _id: new ObjectId(id), userId });
        if (!lead) {
          return { statusCode: 404, body: JSON.stringify({ error: 'Lead not found' }) };
        }
        // Transform statusHistory to activity format
        const activityData = (lead?.statusHistory || []).map(item => ({
          createdAt: item.timestamp,
          action: 'status_change',
          description: item.note || `Status changed to ${item.status}`
        }));
        return { statusCode: 200, body: JSON.stringify(activityData) };
      }

      // single user-lead with populated leadId
      if (id) {
        const leads = await collection.aggregate([
          { $match: { _id: new ObjectId(id), userId } },
          {
            $lookup: {
              from: 'leads',
              localField: 'leadId',
              foreignField: '_id',
              as: 'leadId'
            }
          },
          {
            $unwind: {
              path: '$leadId',
              preserveNullAndEmptyArrays: true
            }
          }
        ]).toArray();
        const lead = leads.length > 0 ? leads[0] : null;
        return { statusCode: 200, body: JSON.stringify(lead) };
      }

      // all leads for this user with populated leadId
      const leads = await collection.aggregate([
        { $match: { userId } },
        {
          $lookup: {
            from: 'leads',
            localField: 'leadId',
            foreignField: '_id',
            as: 'leadId'
          }
        },
        {
          $unwind: {
            path: '$leadId',
            preserveNullAndEmptyArrays: true
          }
        }
      ]).toArray();
      return { statusCode: 200, body: JSON.stringify(leads) };
    }

    // POST
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);

      // Check if user already has this lead saved
      const existing = await collection.findOne({
        userId,
        leadId: new ObjectId(data.leadId)
      });

      if (existing) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Lead already saved' }) };
      }

      // Create a proper userLead document
      const userLeadDoc = {
        userId, // Use authenticated user's ID
        leadId: new ObjectId(data.leadId),
        currentStatus: data.status || data.currentStatus || 'saved',
        statusHistory: [
          {
            status: data.status || data.currentStatus || 'saved',
            timestamp: new Date().toISOString(),
            note: 'Lead saved to pipeline'
          }
        ],
        priority: data.priority || 'medium',
        notes: data.notes || '',
        savedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await collection.insertOne(userLeadDoc);
      const insertedDoc = await collection.findOne({ _id: result.insertedId });
      return { statusCode: 201, body: JSON.stringify(insertedDoc) };
    }

    // PUT
    if (event.httpMethod === 'PUT') {
      if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing ID' }) };

      // Verify user owns this lead
      const existing = await collection.findOne({ _id: new ObjectId(id), userId });
      if (!existing) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Lead not found' }) };
      }

      const data = JSON.parse(event.body);

      // status update
      if (data.status) {
        const updateDoc = {
          currentStatus: data.status,
          updatedAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString()
        };

        // Add timestamp for specific status changes
        if (data.status === 'applied' && !existing.appliedAt) {
          updateDoc.appliedAt = new Date().toISOString();
        } else if (data.status === 'interviewing' && !existing.interviewingAt) {
          updateDoc.interviewingAt = new Date().toISOString();
        }

        // Add to status history
        await collection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: updateDoc,
            $push: {
              statusHistory: {
                status: data.status,
                timestamp: new Date().toISOString(),
                note: data.note || `Status changed to ${data.status}`
              }
            }
          }
        );
      } else {
        // Regular update (priority, notes, etc.)
        const updateData = { ...data };
        delete updateData.userId; // Don't allow changing userId
        delete updateData._id;

        await collection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              ...updateData,
              updatedAt: new Date().toISOString()
            }
          }
        );
      }

      const updated = await collection.findOne({ _id: new ObjectId(id) });
      return { statusCode: 200, body: JSON.stringify(updated) };
    }

    // DELETE
    if (event.httpMethod === 'DELETE') {
      if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing ID' }) };

      // Verify user owns this lead
      const existing = await collection.findOne({ _id: new ObjectId(id), userId });
      if (!existing) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Lead not found' }) };
      }

      await collection.deleteOne({ _id: new ObjectId(id) });
      return { statusCode: 204, body: '' };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (err) {
    console.error('user-leads error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
