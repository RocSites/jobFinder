import fs from 'fs';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Lead from '../models/Lead.js';
import { parseCompensation, parseDate, cleanText, cleanEmail } from '../utils/helpers.js';

dotenv.config();

const importLeads = async (csvFilePath) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const leads = [];
    
    // Read and parse CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          // Map CSV columns to Lead schema
          // Adjust column names to match your CSV
          const lead = {
            title: cleanText(row.title || row.position || row.job_title),
            company: cleanText(row.company || row.company_name),
            location: cleanText(row.location),
            team: cleanText(row.team || row.department),
            compensation: parseCompensation(row.compensation || row.salary || row.comp),
            contactName: cleanText(row.contactName || row.contact_name || row.hiring_manager),
            contactEmail: cleanEmail(row.contactEmail || row.contact_email || row.email),
            sourceLink: cleanText(row.sourceLink || row.source_link || row.url),
            sourceApplicationLink: cleanText(row.sourceApplicationLink || row.application_link || row.apply_url),
            datePosted: parseDate(row.datePosted || row.date_posted || row.posted_date),
            industry: cleanText(row.industry || row.sector)
          };
          
          // Only add if we have minimum required fields
          if (lead.title && lead.company) {
            leads.push(lead);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`Parsed ${leads.length} leads from CSV`);
    
    // Clear existing leads (optional - comment out if you want to keep existing)
    // await Lead.deleteMany({});
    // console.log('Cleared existing leads');
    
    // Insert leads in batches
    const batchSize = 100;
    let imported = 0;
    
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      await Lead.insertMany(batch, { ordered: false });
      imported += batch.length;
      console.log(`Imported ${imported}/${leads.length} leads...`);
    }
    
    console.log(`✅ Successfully imported ${imported} leads!`);
    
    // Show some stats
    const stats = await Lead.aggregate([
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\nLeads by industry:');
    stats.forEach(stat => {
      console.log(`  ${stat._id || 'Unknown'}: ${stat.count}`);
    });
    
  } catch (error) {
    console.error('Error importing leads:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Get CSV file path from command line argument
const csvPath = process.argv[2] || './leads.csv';

if (!fs.existsSync(csvPath)) {
  console.error(`❌ CSV file not found: ${csvPath}`);
  console.log('Usage: node scripts/importLeads.js <path-to-csv>');
  process.exit(1);
}

console.log(`Starting import from: ${csvPath}\n`);
importLeads(csvPath);
