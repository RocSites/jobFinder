/**
 * Migration script to prepare database for multi-user authentication
 *
 * This script:
 * 1. Marks all existing leads as global (isGlobal: true) and createdBy: 'system'
 * 2. Updates existing userleads to associate with a specific Supabase user ID
 * 3. Updates existing referrals to associate with a specific Supabase user ID
 *
 * Run this script ONCE after:
 * 1. Setting up Supabase authentication
 * 2. Creating your admin user account in Supabase
 * 3. Getting the admin user's Supabase ID
 *
 * Usage:
 *   node scripts/migrate-to-multiuser.js <supabase-user-id>
 *
 * Example:
 *   node scripts/migrate-to-multiuser.js abc123-def456-ghi789
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'nextgig2';

async function migrate(newUserId) {
  if (!newUserId) {
    console.error('Error: Please provide a Supabase user ID');
    console.log('Usage: node scripts/migrate-to-multiuser.js <supabase-user-id>');
    console.log('\nTo get your Supabase user ID:');
    console.log('1. Log in to your Supabase dashboard');
    console.log('2. Go to Authentication > Users');
    console.log('3. Find your admin user and copy the "User UID"');
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

    // 1. Migrate leads - mark all as global and created by system
    console.log('\n--- Migrating Leads ---');
    const leadsCollection = db.collection('leads');

    const leadsWithoutGlobal = await leadsCollection.countDocuments({
      isGlobal: { $exists: false }
    });
    console.log(`Found ${leadsWithoutGlobal} leads without isGlobal field`);

    if (leadsWithoutGlobal > 0) {
      const leadsResult = await leadsCollection.updateMany(
        { isGlobal: { $exists: false } },
        {
          $set: {
            isGlobal: true,
            createdBy: 'system',
            updatedAt: new Date().toISOString()
          }
        }
      );
      console.log(`Updated ${leadsResult.modifiedCount} leads to global`);
    }

    // 2. Migrate userleads - update userId from 'user123' to new user ID
    console.log('\n--- Migrating User Leads ---');
    const userLeadsCollection = db.collection('userleads');

    const oldUserLeads = await userLeadsCollection.countDocuments({
      userId: 'user123'
    });
    console.log(`Found ${oldUserLeads} user leads with userId 'user123'`);

    if (oldUserLeads > 0) {
      const userLeadsResult = await userLeadsCollection.updateMany(
        { userId: 'user123' },
        {
          $set: {
            userId: newUserId,
            updatedAt: new Date().toISOString()
          }
        }
      );
      console.log(`Updated ${userLeadsResult.modifiedCount} user leads to new user ID`);
    }

    // 3. Migrate referrals - add userId field
    console.log('\n--- Migrating Referrals ---');
    const referralsCollection = db.collection('referrals');

    const referralsWithoutUser = await referralsCollection.countDocuments({
      userId: { $exists: false }
    });
    console.log(`Found ${referralsWithoutUser} referrals without userId field`);

    if (referralsWithoutUser > 0) {
      const referralsResult = await referralsCollection.updateMany(
        { userId: { $exists: false } },
        {
          $set: {
            userId: newUserId,
            updatedAt: new Date()
          }
        }
      );
      console.log(`Updated ${referralsResult.modifiedCount} referrals with new user ID`);
    }

    // Summary
    console.log('\n========== Migration Complete ==========');
    console.log(`New User ID: ${newUserId}`);
    console.log('');
    console.log('All existing leads are now marked as global (visible to all users)');
    console.log('All existing user leads and referrals are now associated with your account');
    console.log('');
    console.log('Next steps:');
    console.log('1. Add the Supabase environment variables to Netlify');
    console.log('2. Deploy your application');
    console.log('3. Log in with your Supabase account');

  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

// Get user ID from command line argument
const newUserId = process.argv[2];
migrate(newUserId);
