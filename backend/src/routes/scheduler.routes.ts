import { Router } from 'express';
import { getSchedulerStatusController, tickSchedulerController } from '../controllers/scheduler.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

router.get('/status', asyncHandler(getSchedulerStatusController));
router.post('/tick', requireRole('admin'), asyncHandler(tickSchedulerController));

export default router;
