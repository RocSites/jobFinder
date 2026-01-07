import Lead from '../models/Lead.js';

// @desc    Get all leads
// @route   GET /api/leads
export const getLeads = async (req, res) => {
  try {
    const { search, industry, location, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add industry filter
    if (industry) {
      query.industry = industry;
    }
    
    // Add location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    const leads = await Lead.find(query)
      .sort({ datePosted: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Lead.countDocuments(query);
    
    res.json({
      leads,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalLeads: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single lead by ID
// @route   GET /api/leads/:id
export const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new lead
// @route   POST /api/leads
export const createLead = async (req, res) => {
  try {
    const lead = await Lead.create(req.body);
    res.status(201).json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
export const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    res.json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
export const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
