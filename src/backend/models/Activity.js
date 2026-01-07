import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
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
  userLeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserLead'
  },
  action: {
    type: String,
    enum: [
      'saved',
      'unsaved', 
      'note_added',
      'status_changed',
      'priority_changed',
      'lead_updated',
      'message_sent',
      'message_received'
    ],
    required: true
  },
  details: {
    type: Map,
    of: String
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

activitySchema.index({ userLeadId: 1, createdAt: -1 });
activitySchema.index({ userId: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
