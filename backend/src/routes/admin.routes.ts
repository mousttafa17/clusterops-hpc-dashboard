import { Router } from 'express';
import { listAuditLogsController, listUsersController } from '../controllers/admin.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);
router.use(requireRole('admin'));

router.get('/users', asyncHandler(listUsersController));
router.get('/audit-logs', asyncHandler(listAuditLogsController));

export default router;
