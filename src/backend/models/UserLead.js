import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['saved', 'applied', 'interviewing', 'offer', 'rejected', 'archived'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String,
    trim: true
  }
}, { _id: false });

const userLeadSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  currentStatus: {
    type: String,
    enum: ['saved', 'applied', 'interviewing', 'offer', 'rejected', 'archived'],
    default: 'saved'
  },
  statusHistory: [statusHistorySchema],
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  notes: {
    type: String,
    trim: true
  },
  customFields: {
    type: Map,
    of: String
  },
  // Milestone timestamps
  savedAt: {
    type: Date,
    default: Date.now
  },
  appliedAt: Date,
  interviewingAt: Date,
  offerAt: Date,
  // Metadata
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure user can only save a lead once
userLeadSchema.index({ userId: 1, leadId: 1 }, { unique: true });
userLeadSchema.index({ userId: 1, currentStatus: 1 });
userLeadSchema.index({ userId: 1, priority: 1 });
userLeadSchema.index({ userId: 1, lastActivityAt: -1 });

const UserLead = mongoose.model('UserLead', userLeadSchema);

export default UserLead;
