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

      // Parse query parameters for pagination and sorting
      const { page = '1', limit = '10', sort = '-_id' } = event.queryStringParameters || {};
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      // Parse sort parameter (e.g., '-_id' means descending by ObjectId/creation time)
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortOrder = sort.startsWith('-') ? -1 : 1;
      const sortObj = { [sortField]: sortOrder };

      // Get total count for pagination
      const totalLeads = await collection.countDocuments({});

      // Fetch leads with pagination and sorting
      // Sorting by _id (descending) gives us newest first since ObjectId contains timestamp
      const allLeads = await collection
        .find({})
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
