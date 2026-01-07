import express from 'express';
import {
  getUserLeads,
  getUserLeadById,
  saveLead,
  updateUserLead,
  updateStatus,
  getPipeline,
  unsaveLead,
  getLeadActivity
} from '../controllers/userLeadController.js';

const router = express.Router();

// Pipeline view
router.get('/pipeline', getPipeline);

// CRUD operations
router.route('/')
  .get(getUserLeads)
  .post(saveLead);

router.route('/:id')
  .get(getUserLeadById)
  .put(updateUserLead)
  .delete(unsaveLead);

// Status management
router.put('/:id/status', updateStatus);

// Activity timeline
router.get('/:id/activity', getLeadActivity);

export default router;
