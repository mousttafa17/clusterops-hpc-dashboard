import { Router } from 'express';
import {
  cancelJobController,
  createJobController,
  getJobController,
  listJobsController
} from '../controllers/jobs.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(listJobsController));
router.post('/', asyncHandler(createJobController));
router.get('/:id', asyncHandler(getJobController));
router.patch('/:id/cancel', asyncHandler(cancelJobController));

export default router;
