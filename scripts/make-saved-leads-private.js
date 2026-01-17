/**
 * Script to make saved leads private (isGlobal: false)
 *
 * This finds all leads that are linked to your userleads and marks them as private.
 *
 * Usage:
 *   node scripts/make-saved-leads-private.js <your-supabase-user-id>
 *
 * Example:
 *   node scripts/make-saved-leads-private.js 55f3eb77-1c1f-4388-9e89-b86c52946bb1
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'nextgig2';

async function makeSavedLeadsPrivate(userId) {
  if (!userId) {
    console.error('Error: Please provide your Supabase user ID');
    console.log('Usage: node scripts/make-saved-leads-private.js <your-supabase-user-id>');
    process.exit(1);
  }

  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI environment variable not set');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(MONGODB_DB_NAME);
    const userLeadsCollection = db.collection('userleads');
    const leadsCollection = db.collection('leads');

    // Get all lead IDs from user's saved leads
    const userLeads = await userLeadsCollection.find({ userId }).toArray();
    console.log(`Found ${userLeads.length} saved leads for user ${userId}`);

    if (userLeads.length === 0) {
      console.log('No saved leads found. Nothing to update.');
      return;
    }

    const leadIds = userLeads.map(ul => ul.leadId);

    // Update those leads to be private
    const result = await leadsCollection.updateMany(
      { _id: { $in: leadIds } },
      { $set: { isGlobal: false } }
    );

    console.log(`Updated ${result.modifiedCount} leads to private (isGlobal: false)`);
    console.log('\nDone! Your saved leads are now private.');

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

const userId = process.argv[2];
makeSavedLeadsPrivate(userId);
