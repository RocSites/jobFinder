import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  team: {
    type: String,
    trim: true
  },
  compensation: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    raw: String // Original string like "$150k-$175k"
  },
  contactName: {
    type: String,
    trim: true
  },
  contactEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  additionalEmails: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  additionalLinks: [{
    title: {
      type: String,
      trim: true
    },
    url: {
      type: String,
      trim: true
    }
  }],
  contactLinkedIn: {
    type: String,
    trim: true
  },
  sourceLink: {
    type: String,
    trim: true
  },
  sourceApplicationLink: {
    type: String,
    trim: true
  },
  datePosted: {
    type: Date
  },
  industry: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
leadSchema.index({ company: 1, title: 1 });
leadSchema.index({ industry: 1 });
leadSchema.index({ datePosted: -1 });
leadSchema.index({ contactEmail: 1 });

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
