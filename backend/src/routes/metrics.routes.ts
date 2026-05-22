import { Router } from 'express';
import { getOverviewMetricsController } from '../controllers/metrics.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

router.get('/overview', asyncHandler(getOverviewMetricsController));

export default router;
