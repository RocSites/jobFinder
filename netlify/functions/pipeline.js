// netlify/functions/pipeline.js
import { MongoClient } from "mongodb";
import { requireAuth } from "./utils/auth.js";

/**
 * CORS config
 * Adjust origin for production if needed
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

let cachedDb;

const connectDB = async () => {
  if (cachedDb) return cachedDb;

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();

  cachedDb = client.db(process.env.MONGODB_DB_NAME || "nextgig2");
  return cachedDb;
};

export const handler = async (event) => {
  /**
   * ✅ CORS PREFLIGHT — MUST RUN BEFORE AUTH
   */
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  /**
   * 🔐 AUTH — ONLY FOR REAL REQUESTS
   */
  const { user, error } = await requireAuth(event);

  if (error) {
    return {
      ...error,
      headers: {
        ...corsHeaders,
        ...(error.headers || {}),
      },
    };
  }

  try {
    const db = await connectDB();

    const pipeline = await db
      .collection("userleads")
      .aggregate([
        {
          $match: { userId: user.id },
        },
        {
          $lookup: {
            from: "leads",
            localField: "leadId",
            foreignField: "_id",
            as: "leadDetails",
          },
        },
        {
          $unwind: {
            path: "$leadDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "referrals",
            let: { userLeadIdStr: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: [
                      "$$userLeadIdStr",
                      { $ifNull: ["$linkedLeads", []] },
                    ],
                  },
                },
              },
            ],
            as: "referrals",
          },
        },
        {
          $addFields: {
            userLeadData: {
              _id: "$_id",
              userId: "$userId",
              leadId: "$leadId",
              currentStatus: "$currentStatus",
              statusHistory: "$statusHistory",
              priority: "$priority",
              notes: "$notes",
              savedAt: "$savedAt",
              lastActivityAt: "$lastActivityAt",
              createdAt: "$createdAt",
              updatedAt: "$updatedAt",
              appliedAt: "$appliedAt",
              interviewingAt: "$interviewingAt",
            },
            referral: { $arrayElemAt: ["$referrals", 0] },
          },
        },
        {
          $group: {
            _id: "$currentStatus",
            count: { $sum: 1 },
            leads: {
              $push: {
                userLead: "$userLeadData",
                leadDetails: "$leadDetails",
                referral: "$referral",
              },
            },
          },
        },
      ])
      .toArray();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(pipeline),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
