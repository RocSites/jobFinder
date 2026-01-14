// netlify/functions/referrals.js
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
  const collection = db.collection('referrals');

  try {
    const { id, activity } = event.queryStringParameters || {};

    // GET requests
    if (event.httpMethod === 'GET') {
      // /referrals/:id/activity
      if (activity === 'true' && id) {
        const referral = await collection.findOne({ _id: new ObjectId(id) });
        // For now, activity will be based on notes updates
        // You can expand this later to track more detailed activity
        const activityData = referral?.activityHistory || [];
        return { statusCode: 200, body: JSON.stringify(activityData) };
      }

      // single referral by ID
      if (id) {
        const referral = await collection.findOne({ _id: new ObjectId(id) });
        if (!referral) {
          return { statusCode: 404, body: JSON.stringify({ message: 'Referral not found' }) };
        }
        return { statusCode: 200, body: JSON.stringify(referral) };
      }

      // all referrals
      const referrals = await collection.find({}).sort({ createdAt: -1 }).toArray();
      return { statusCode: 200, body: JSON.stringify(referrals) };
    }

    // POST - Create new referral
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);

      const newReferral = {
        name: data.name,
        company: data.company || '',
        email: data.email || '',
        linkedin: data.linkedin || '',
        notes: data.notes || '',
        linkedLeads: data.linkedLeads || [],
        activityHistory: [
          {
            createdAt: new Date(),
            action: 'created',
            description: 'Referral created'
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.insertOne(newReferral);
      const createdReferral = await collection.findOne({ _id: result.insertedId });

      return { statusCode: 201, body: JSON.stringify(createdReferral) };
    }

    // PUT - Update referral
    if (event.httpMethod === 'PUT') {
      if (!id) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Referral ID required' }) };
      }

      const data = JSON.parse(event.body);
      const existingReferral = await collection.findOne({ _id: new ObjectId(id) });

      if (!existingReferral) {
        return { statusCode: 404, body: JSON.stringify({ message: 'Referral not found' }) };
      }

      // Build activity history entry based on what changed
      let activityDescription = 'Referral updated';
      if (data.notes && data.notes !== existingReferral.notes) {
        activityDescription = 'Notes updated';
      } else if (data.linkedLeads && data.linkedLeads.length !== existingReferral.linkedLeads?.length) {
        activityDescription = data.linkedLeads.length > (existingReferral.linkedLeads?.length || 0)
          ? 'Lead linked'
          : 'Lead unlinked';
      }

      const activityHistory = [
        ...(existingReferral.activityHistory || []),
        {
          createdAt: new Date(),
          action: 'updated',
          description: activityDescription
        }
      ];

      const updateData = {
        ...data,
        activityHistory,
        updatedAt: new Date()
      };

      await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      const updatedReferral = await collection.findOne({ _id: new ObjectId(id) });
      return { statusCode: 200, body: JSON.stringify(updatedReferral) };
    }

    // DELETE - Remove referral
    if (event.httpMethod === 'DELETE') {
      if (!id) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Referral ID required' }) };
      }

      const result = await collection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return { statusCode: 404, body: JSON.stringify({ message: 'Referral not found' }) };
      }

      return { statusCode: 204, body: '' };
    }

    return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };

  } catch (err) {
    console.error('Error in referrals handler:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message || 'Internal server error' })
    };
  }
};
