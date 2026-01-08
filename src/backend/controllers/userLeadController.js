import UserLead from '../models/UserLead.js';
import Lead from '../models/Lead.js';
import Activity from '../models/Activity.js';

// Valid status transitions (allows moving forward and backward between stages)
const STATUS_FLOW = {
  saved: ['applied', 'rejected', 'archived'],
  applied: ['saved', 'interviewing', 'rejected', 'archived'],
  interviewing: ['saved', 'applied', 'offer', 'rejected', 'archived'],
  offer: ['saved', 'applied', 'interviewing', 'rejected', 'archived'],
  rejected: ['saved', 'applied', 'interviewing', 'archived'],
  archived: ['saved', 'applied', 'interviewing', 'offer', 'rejected']
};

// @desc    Get all user's saved leads
// @route   GET /api/user-leads
export const getUserLeads = async (req, res) => {
  try {
    const userId = req.query.userId || process.env.DEFAULT_USER_ID;
    const { status, priority, sortBy = 'lastActivityAt', order = 'desc' } = req.query;
    
    const query = { userId };
    
    if (status) {
      query.currentStatus = status;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    const userLeads = await UserLead.find(query)
      .populate('leadId')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 });
    
    res.json(userLeads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user lead by LEAD ID (not userLead ID) - NEW!
// @route   GET /api/user-leads/by-lead/:leadId
export const getUserLeadByLeadId = async (req, res) => {
  try {
    const userId = req.query.userId || process.env.DEFAULT_USER_ID;
    
    const userLead = await UserLead.findOne({
      leadId: req.params.leadId,
      userId
    }).populate('leadId');
    
    if (!userLead) {
      return res.status(404).json({ message: 'User lead not found' });
    }
    
    res.json(userLead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user lead by ID with full details
// @route   GET /api/user-leads/:id
export const getUserLeadById = async (req, res) => {
  try {
    const userId = req.query.userId || process.env.DEFAULT_USER_ID;
    
    const userLead = await UserLead.findOne({
      _id: req.params.id,
      userId
    }).populate('leadId');
    
    if (!userLead) {
      return res.status(404).json({ message: 'User lead not found' });
    }
    
    res.json(userLead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save a lead for user
// @route   POST /api/user-leads
export const saveLead = async (req, res) => {
  try {
    const userId = req.body.userId || process.env.DEFAULT_USER_ID;
    const { leadId, priority, notes } = req.body;
    
    // Check if lead exists
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    // Create user lead
    const userLeadData = {
      userId,
      leadId,
      currentStatus: 'saved',
      statusHistory: [{
        status: 'saved',
        timestamp: new Date(),
        note: 'Lead saved to pipeline'
      }]
    };

    // Only add priority if provided
    if (priority) {
      userLeadData.priority = priority;
    }

    // Only add notes if provided
    if (notes) {
      userLeadData.notes = notes;
    }

    const userLead = await UserLead.create(userLeadData);
    
    // Log activity
    await Activity.create({
      userId,
      leadId,
      userLeadId: userLead._id,
      action: 'saved',
      description: `Saved ${lead.title} at ${lead.company}`
    });
    
    const populatedUserLead = await UserLead.findById(userLead._id).populate('leadId');
    res.status(201).json(populatedUserLead);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Lead already saved' });
    }
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update user lead (priority, notes, etc.)
// @route   PUT /api/user-leads/:id
export const updateUserLead = async (req, res) => {
  try {
    const userId = req.body.userId || process.env.DEFAULT_USER_ID;
    const { priority, notes } = req.body;
    
    const userLead = await UserLead.findOne({
      _id: req.params.id,
      userId
    });
    
    if (!userLead) {
      return res.status(404).json({ message: 'User lead not found' });
    }
    
    // Track what changed
    const changes = {};
    if (priority && priority !== userLead.priority) {
      changes.priority = { from: userLead.priority, to: priority };
      userLead.priority = priority;
    }
    
    if (notes !== undefined) {
      userLead.notes = notes;
    }
    
    userLead.lastActivityAt = new Date();
    await userLead.save();
    
    // Log activity for priority change
    if (changes.priority) {
      await Activity.create({
        userId,
        leadId: userLead.leadId,
        userLeadId: userLead._id,
        action: 'priority_changed',
        details: new Map(Object.entries(changes.priority)),
        description: `Priority changed from ${changes.priority.from} to ${changes.priority.to}`
      });
    }
    
    const populatedUserLead = await UserLead.findById(userLead._id).populate('leadId');
    res.json(populatedUserLead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update pipeline status
// @route   PUT /api/user-leads/:id/status
export const updateStatus = async (req, res) => {
  try {
    const userId = req.body.userId || process.env.DEFAULT_USER_ID;
    const { status, note } = req.body;
    
    const userLead = await UserLead.findOne({
      _id: req.params.id,
      userId
    });
    
    if (!userLead) {
      return res.status(404).json({ message: 'User lead not found' });
    }
    
    // Validate status transition
    if (!STATUS_FLOW[userLead.currentStatus]?.includes(status)) {
      return res.status(400).json({ 
        message: `Cannot transition from ${userLead.currentStatus} to ${status}` 
      });
    }
    
    const oldStatus = userLead.currentStatus;
    
    // Update status and history
    userLead.currentStatus = status;
    userLead.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status changed to ${status}`
    });
    
    // Update milestone timestamps
    if (status === 'applied' && !userLead.appliedAt) {
      userLead.appliedAt = new Date();
    } else if (status === 'interviewing' && !userLead.interviewingAt) {
      userLead.interviewingAt = new Date();
    } else if (status === 'offer' && !userLead.offerAt) {
      userLead.offerAt = new Date();
    }
    
    userLead.lastActivityAt = new Date();
    await userLead.save();
    
    // Log activity
    await Activity.create({
      userId,
      leadId: userLead.leadId,
      userLeadId: userLead._id,
      action: 'status_changed',
      details: new Map([['from', oldStatus], ['to', status]]),
      description: `Status changed from ${oldStatus} to ${status}`
    });
    
    const populatedUserLead = await UserLead.findById(userLead._id).populate('leadId');
    res.json(populatedUserLead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get pipeline view (grouped by status)
// @route   GET /api/user-leads/pipeline
export const getPipeline = async (req, res) => {
  try {
    const userId = req.query.userId || process.env.DEFAULT_USER_ID;
    
    const pipeline = await UserLead.aggregate([
      { $match: { userId } },
      {
        $lookup: {
          from: 'leads',
          localField: 'leadId',
          foreignField: '_id',
          as: 'leadDetails'
        }
      },
      { $unwind: '$leadDetails' },
      {
        $group: {
          _id: '$currentStatus',
          leads: { 
            $push: {
              userLead: '$$ROOT',
              leadDetails: '$leadDetails'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    res.json(pipeline);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user lead (unsave)
// @route   DELETE /api/user-leads/:id
export const unsaveLead = async (req, res) => {
  try {
    const userId = req.query.userId || process.env.DEFAULT_USER_ID;
    
    const userLead = await UserLead.findOneAndDelete({
      _id: req.params.id,
      userId
    });
    
    if (!userLead) {
      return res.status(404).json({ message: 'User lead not found' });
    }
    
    // Log activity
    await Activity.create({
      userId,
      leadId: userLead.leadId,
      action: 'unsaved',
      description: 'Lead removed from pipeline'
    });
    
    res.json({ message: 'Lead removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get activity timeline for a user lead
// @route   GET /api/user-leads/:id/activity
export const getLeadActivity = async (req, res) => {
  try {
    const userId = req.query.userId || process.env.DEFAULT_USER_ID;
    
    const userLead = await UserLead.findOne({
      _id: req.params.id,
      userId
    });
    
    if (!userLead) {
      return res.status(404).json({ message: 'User lead not found' });
    }
    
    const activities = await Activity.find({
      userLeadId: req.params.id
    }).sort({ createdAt: -1 });
    
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
