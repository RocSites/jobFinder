import fs from 'fs';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

// Lead Schema (inline for the script)
const leadSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  location: { type: String, trim: true },
  team: { type: String, trim: true },
  compensation: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'USD' },
    raw: String
  },
  contactName: { type: String, trim: true },
  contactEmail: { type: String, lowercase: true, trim: true },
  sourceLink: { type: String, trim: true },
  sourceApplicationLink: { type: String, trim: true },
  datePosted: { type: Date },
  industry: { type: String, trim: true },
  contactLinkedIn: { type: String, trim: true },
  sourceType: { type: String, trim: true }
}, { timestamps: true });

const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema);

// Helper functions
const parseCompensation = (compString) => {
  if (!compString || compString === 'Unknown') return { min: null, max: null, currency: 'USD', raw: compString };
  
  const raw = compString.toString().trim();
  const cleaned = raw.replace(/[$,]/g, '').replace(/k/gi, '000');
  const rangeMatch = cleaned.match(/(\d+)\s*-\s*(\d+)/);
  
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1]),
      max: parseInt(rangeMatch[2]),
      currency: 'USD',
      raw
    };
  }
  
  const singleMatch = cleaned.match(/(\d+)/);
  if (singleMatch) {
    const amount = parseInt(singleMatch[1]);
    return { min: amount, max: amount, currency: 'USD', raw };
  }
  
  return { min: null, max: null, currency: 'USD', raw };
};

const parseDate = (dateString) => {
  if (!dateString) return null;
  
  // Handle MM/DD/YY format (e.g., "1/9/25")
  const parts = dateString.split('/');
  if (parts.length === 3) {
    let [month, day, year] = parts;
    // Convert 2-digit year to 4-digit (25 -> 2025)
    if (year.length === 2) {
      year = '20' + year;
    }
    const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    return isNaN(date.getTime()) ? null : date;
  }
  
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

const cleanText = (text) => {
  if (!text) return '';
  return text.toString().trim();
};

const cleanEmail = (email) => {
  if (!email) return '';
  // Handle multiple emails separated by comma
  const emails = email.toString().toLowerCase().trim().split(',');
  return emails[0].trim(); // Take first email
};

const importLeads = async (csvFilePath) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const leads = [];
    let lineNumber = 0;
    
    // Read and parse CSV WITHOUT headers
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv({
          headers: false, // No header row in CSV
          skipLines: 0     // Don't skip any lines
        }))
        .on('data', (row) => {
          lineNumber++;
          
          // CSV structure (by column index):
          // 0: Title
          // 1: Company
          // 2: Location
          // 3: Team
          // 4: Compensation
          // 5: Date Posted
          // 6: Contact Name
          // 7: Contact Email
          // 8: LinkedIn URL
          // 9: Source Type (LinkedIn, Ycombinator, etc.)
          // 10: Source Link
          // 11: Application Link
          // 12: Industry
          
          const columns = Object.values(row);
          
          const lead = {
            title: cleanText(columns[0]),
            company: cleanText(columns[1]),
            location: cleanText(columns[2]),
            team: cleanText(columns[3]),
            compensation: parseCompensation(columns[4]),
            datePosted: parseDate(columns[5]),
            contactName: cleanText(columns[6]),
            contactEmail: cleanEmail(columns[7]),
            contactLinkedIn: cleanText(columns[8]),
            sourceType: cleanText(columns[9]),
            sourceLink: cleanText(columns[10]),
            sourceApplicationLink: cleanText(columns[11]),
            industry: cleanText(columns[12])
          };
          
          // Only add if we have minimum required fields
          if (lead.title && lead.company) {
            leads.push(lead);
          } else {
            console.log(`⚠️  Skipping line ${lineNumber}: missing title or company`);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`\n✅ Parsed ${leads.length} leads from CSV`);
    
    if (leads.length === 0) {
      console.log('❌ No valid leads found. Check your CSV format.');
      return;
    }
    
    // Show a sample lead for verification
    console.log('\n📋 Sample lead:');
    console.log(JSON.stringify(leads[0], null, 2));
    
    // Ask for confirmation (optional - comment out for automatic import)
    // const readline = require('readline').createInterface({
    //   input: process.stdin,
    //   output: process.stdout
    // });
    // await new Promise(resolve => {
    //   readline.question('\nProceed with import? (y/n) ', answer => {
    //     readline.close();
    //     if (answer.toLowerCase() !== 'y') process.exit(0);
    //     resolve();
    //   });
    // });
    
    // Clear existing leads (optional - comment out if you want to keep existing)
    console.log('\n🗑️  Clearing existing leads...');
    await Lead.deleteMany({});
    console.log('✅ Cleared existing leads');
    
    // Insert leads in batches
    const batchSize = 100;
    let imported = 0;
    
    console.log('\n📦 Importing leads...');
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      try {
        await Lead.insertMany(batch, { ordered: false });
        imported += batch.length;
        console.log(`   Imported ${imported}/${leads.length} leads...`);
      } catch (error) {
        // Handle duplicate key errors gracefully
        if (error.code === 11000) {
          console.log(`   ⚠️  Some duplicates in batch ${i / batchSize + 1}, continuing...`);
          imported += batch.length;
        } else {
          throw error;
        }
      }
    }
    
    console.log(`\n✅ Successfully imported ${imported} leads!`);
    
    // Show some stats
    const stats = await Lead.aggregate([
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    console.log('\n📊 Top 10 Industries:');
    stats.forEach(stat => {
      console.log(`   ${stat._id || 'Unknown'}: ${stat.count} leads`);
    });
    
    const totalCount = await Lead.countDocuments();
    console.log(`\n📈 Total leads in database: ${totalCount}`);
    
  } catch (error) {
    console.error('❌ Error importing leads:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Get CSV file path from command line argument
const csvPath = process.argv[2];

if (!csvPath) {
  console.error('❌ Please provide CSV file path');
  console.log('Usage: node importLeads-fixed.js <path-to-csv>');
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`❌ CSV file not found: ${csvPath}`);
  process.exit(1);
}

console.log(`🚀 Starting import from: ${csvPath}\n`);
importLeads(csvPath);
