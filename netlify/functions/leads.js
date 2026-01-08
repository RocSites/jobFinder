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
    if (event.httpMethod === 'GET') {
      const { id } = event.queryStringParameters || {};
      if (id) {
        const lead = await collection.findOne({ _id: new ObjectId(id) });
        return { statusCode: 200, body: JSON.stringify(lead) };
      }
      const allLeads = await collection.find({}).toArray();
      return { statusCode: 200, body: JSON.stringify(allLeads) };
    }

    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      const result = await collection.insertOne(data);
      return { statusCode: 201, body: JSON.stringify(result.ops[0]) };
    }

    if (event.httpMethod === 'PUT') {
      const { id } = event.queryStringParameters || {};
      const updates = JSON.parse(event.body);
      await collection.updateOne({ _id: new ObjectId(id) }, { $set: updates });
      const updated = await collection.findOne({ _id: new ObjectId(id) });
      return { statusCode: 200, body: JSON.stringify(updated) };
    }

    if (event.httpMethod === 'DELETE') {
      const { id } = event.queryStringParameters || {};
      await collection.deleteOne({ _id: new ObjectId(id) });
      return { statusCode: 204, body: '' };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
