import { Router } from 'express';
import {
  createNodeController,
  listNodesController,
  updateNodeStatusController
} from '../controllers/nodes.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(listNodesController));
router.post('/', requireRole('admin'), asyncHandler(createNodeController));
router.patch('/:id/status', requireRole('admin'), asyncHandler(updateNodeStatusController));

export default router;
