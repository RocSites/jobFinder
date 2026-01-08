// netlify/functions/leads.js
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
  const collection = db.collection('leads');

  try {
    const { id } = event.queryStringParameters || {};

    // GET
    if (event.httpMethod === 'GET') {
      if (id) {
        const lead = await collection.findOne({ _id: new ObjectId(id) });
        return { statusCode: 200, body: JSON.stringify(lead) };
      }
      const allLeads = await collection.find({}).toArray();
      return {
        statusCode: 200,
        body: JSON.stringify({
          leads: allLeads,
          totalLeads: allLeads.length
        })
      };
    }

    // POST
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      const result = await collection.insertOne(data);
      const insertedDoc = await collection.findOne({ _id: result.insertedId });
      return { statusCode: 201, body: JSON.stringify(insertedDoc) };
    }

    // PUT
    if (event.httpMethod === 'PUT') {
      if (!id) return { statusCode: 400, body: 'Missing ID' };
      const updates = JSON.parse(event.body);
      await collection.updateOne({ _id: new ObjectId(id) }, { $set: updates });
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
