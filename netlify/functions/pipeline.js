import { MongoClient } from 'mongodb';

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

export const handler = async () => {
  try {
    const db = await connectDB();
    const pipeline = await db.collection('userLeads').aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          leads: { $push: '$$ROOT' }
        }
      }
    ]).toArray();

    return {
      statusCode: 200,
      body: JSON.stringify(pipeline),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
