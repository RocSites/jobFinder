// netlify/functions/publish-leads.js
// Publishes private leads to the public database (makes them global)
import { MongoClient, ObjectId } from 'mongodb';
import { requireAuth } from './utils/auth.js';

let cachedDb;

const connectDB = async () => {
  if (cachedDb) return cachedDb;
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  cachedDb = client.db(process.env.MONGODB_DB_NAME || 'nextgig2');
  return cachedDb;
};

export const handler = async (event) => {
  // Only POST is allowed
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // Require authentication
  const { user, error } = await requireAuth(event);
  if (error) return error;

  try {
    const db = await connectDB();
    const leadsCollection = db.collection('leads');
    const userLeadsCollection = db.collection('userleads');

    const data = JSON.parse(event.body);
    const { mode, leadId } = data;

    if (mode === 'single' && leadId) {
      // Publish a single lead (stripped of personal info)
      const userLead = await userLeadsCollection.findOne({
        leadId: new ObjectId(leadId),
        userId: user.id
      });

      if (!userLead) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Lead not found in your pipeline' }) };
      }

      // Get the lead
      const lead = await leadsCollection.findOne({ _id: new ObjectId(leadId) });
      if (!lead) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Lead not found' }) };
      }

      // Create a sanitized version for public (strip personal info)
      const publicLeadData = {
        title: lead.title,
        company: lead.company,
        location: lead.location || '',
        team: lead.team || '',
        compensation: lead.compensation || {},
        industry: lead.industry || '',
        datePosted: lead.datePosted || new Date().toISOString(),
        sourceLink: lead.sourceLink || '',
        sourceApplicationLink: lead.sourceApplicationLink || '',
        // Mark as global and track who shared it
        isGlobal: true,
        createdBy: 'community', // Indicates it was shared by community
        sharedBy: user.id,
        sharedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // If lead was private (not already global), update it
      if (!lead.isGlobal) {
        await leadsCollection.updateOne(
          { _id: new ObjectId(leadId) },
          { $set: publicLeadData }
        );
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Lead published successfully', leadId })
      };

    } else if (mode === 'all') {
      // Publish all user's saved leads
      const userLeads = await userLeadsCollection.find({ userId: user.id }).toArray();

      if (userLeads.length === 0) {
        return { statusCode: 200, body: JSON.stringify({ message: 'No leads to publish', count: 0 }) };
      }

      const leadIds = userLeads.map(ul => ul.leadId);

      // Get all leads that are not already global
      const leads = await leadsCollection.find({
        _id: { $in: leadIds },
        isGlobal: { $ne: true }
      }).toArray();

      if (leads.length === 0) {
        return { statusCode: 200, body: JSON.stringify({ message: 'All leads are already public', count: 0 }) };
      }

      // Update each lead to be global (strip personal info)
      const bulkOps = leads.map(lead => ({
        updateOne: {
          filter: { _id: lead._id },
          update: {
            $set: {
              isGlobal: true,
              createdBy: 'community',
              sharedBy: user.id,
              sharedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              // Clear personal info
              contactName: '',
              contactEmail: '',
              additionalEmails: [],
              contactLinkedIn: ''
              // Keep: title, company, location, compensation, sourceLink, sourceApplicationLink
            },
            $unset: {
              additionalLinks: '' // Remove personal links
            }
          }
        }
      }));

      await leadsCollection.bulkWrite(bulkOps);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `${leads.length} lead(s) published successfully`,
          count: leads.length
        })
      };

    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid mode. Use "single" or "all"' }) };
    }

  } catch (err) {
    console.error('publish-leads error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
