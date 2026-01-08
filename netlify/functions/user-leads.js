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
        const userLead = await collection.findOne({ leadId, userId });
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
      const result = await collection.insertOne(data);
      return { statusCode: 201, body: JSON.stringify(result.ops[0]) };
    }

    // PUT
    if (event.httpMethod === 'PUT') {
      if (!id) return { statusCode: 400, body: 'Missing ID' };
      const data = JSON.parse(event.body);

      // status update
      if (data.status) {
        await collection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: data.status, note: data.note || '' } }
        );
      } else {
        await collection.updateOne({ _id: new ObjectId(id) }, { $set: data });
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
