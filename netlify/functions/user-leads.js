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
  const collection = db.collection('userLeads');

  try {
    if (event.httpMethod === 'GET') {
      const { id, userId } = event.queryStringParameters || {};

      if (id) {
        const lead = await collection.findOne({ _id: new ObjectId(id) });
        return { statusCode: 200, body: JSON.stringify(lead) };
      }

      return { statusCode: 200, body: JSON.stringify(await collection.find({ userId }).toArray()) };
    }

    if (event.httpMethod === 'PUT') {
      const { id } = event.queryStringParameters || {};
      const data = JSON.parse(event.body);

      // status update
      if (data.status) {
        await collection.updateOne({ _id: new ObjectId(id) }, { $set: { status: data.status } });
      } else {
        await collection.updateOne({ _id: new ObjectId(id) }, { $set: data });
      }

      const updated = await collection.findOne({ _id: new ObjectId(id) });
      return { statusCode: 200, body: JSON.stringify(updated) };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const result = await collection.insertOne(body);
      return { statusCode: 201, body: JSON.stringify(result.ops[0]) };
    }

    if (event.httpMethod === 'DELETE') {
      const { id } = event.queryStringParameters || {};
      await collection.deleteOne({ _id: new ObjectId(id) });
      return { statusCode: 204, body: '' };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
