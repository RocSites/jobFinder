import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['email', 'note', 'call', 'meeting'],
    default: 'note'
  },
  subject: {
    type: String,
    trim: true
  },
  body: {
    type: String,
    trim: true
  },
  from: {
    type: String,
    trim: true
  },
  to: {
    type: String,
    trim: true
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    default: 'outbound'
  },
  metadata: {
    emailId: String,
    threadId: String
  }
}, {
  timestamps: true
});

messageSchema.index({ userLeadId: 1, createdAt: -1 });
messageSchema.index({ userId: 1, leadId: 1, createdAt: -1 });
messageSchema.index({ from: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
