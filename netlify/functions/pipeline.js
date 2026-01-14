// netlify/functions/pipeline.js
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
    const pipeline = await db.collection('userleads').aggregate([
      {
        // Join with leads collection to get lead details
        $lookup: {
          from: 'leads',
          localField: 'leadId',
          foreignField: '_id',
          as: 'leadDetails'
        }
      },
      {
        // Unwind the leadDetails array (should only have 1 item)
        $unwind: {
          path: '$leadDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        // Lookup referrals that have this userLead linked
        $lookup: {
          from: 'referrals',
          let: { userLeadIdStr: { $toString: '$_id' } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$$userLeadIdStr', { $ifNull: ['$linkedLeads', []] }]
                }
              }
            }
          ],
          as: 'referrals'
        }
      },
      {
        // Add a field to separate userLead from leadDetails before grouping
        $addFields: {
          userLeadData: {
            _id: '$_id',
            userId: '$userId',
            leadId: '$leadId',
            currentStatus: '$currentStatus',
            statusHistory: '$statusHistory',
            priority: '$priority',
            notes: '$notes',
            savedAt: '$savedAt',
            lastActivityAt: '$lastActivityAt',
            createdAt: '$createdAt',
            updatedAt: '$updatedAt',
            appliedAt: '$appliedAt',
            interviewingAt: '$interviewingAt'
          },
          referral: { $arrayElemAt: ['$referrals', 0] } // Get first referral (should only be one)
        }
      },
      {
        // Group by status
        $group: {
          _id: '$currentStatus',
          count: { $sum: 1 },
          leads: {
            $push: {
              userLead: '$userLeadData',
              leadDetails: '$leadDetails',
              referral: '$referral'
            }
          }
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
