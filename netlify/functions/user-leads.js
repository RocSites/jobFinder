// netlify/functions/user-leads.js
import { MongoClient, ObjectId } from 'mongodb';

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
  const db = await connectDB();
  const collection = db.collection('userleads');

  try {
    const { id, userId, leadId, activity } = event.queryStringParameters || {};

    // GET requests
    if (event.httpMethod === 'GET') {
      // /user-leads/by-lead
      if (leadId) {
        const query = { leadId: new ObjectId(leadId) };
        if (userId) query.userId = userId;
        const userLead = await collection.findOne(query);
        return { statusCode: 200, body: JSON.stringify(userLead) };
      }

      // /user-leads/:id/activity
      if (activity === 'true' && id) {
        const lead = await collection.findOne({ _id: new ObjectId(id) });
        return { statusCode: 200, body: JSON.stringify(lead?.activity || []) };
      }

      // single user-lead
      if (id) {
        const lead = await collection.findOne({ _id: new ObjectId(id) });
        return { statusCode: 200, body: JSON.stringify(lead) };
      }

      // all leads
      const query = userId ? { userId } : {};
      const leads = await collection.find(query).toArray();
      return { statusCode: 200, body: JSON.stringify(leads) };
    }

    // POST
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);

      // Create a proper userLead document with defaults
      const userLeadDoc = {
        userId: data.userId || 'user123', // Default user for now
        leadId: new ObjectId(data.leadId),
        currentStatus: data.status || 'saved',
        statusHistory: [
          {
            status: data.status || 'saved',
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
      if (!id) return { statusCode: 400, body: 'Missing ID' };
      const data = JSON.parse(event.body);

      // status update
      if (data.status) {
        const updateDoc = {
          currentStatus: data.status,
          updatedAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString()
        };

        // Add timestamp for specific status changes
        if (data.status === 'applied' && !data.appliedAt) {
          updateDoc.appliedAt = new Date().toISOString();
        } else if (data.status === 'interviewing' && !data.interviewingAt) {
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
        await collection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              ...data,
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
      if (!id) return { statusCode: 400, body: 'Missing ID' };
      await collection.deleteOne({ _id: new ObjectId(id) });
      return { statusCode: 204, body: '' };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
