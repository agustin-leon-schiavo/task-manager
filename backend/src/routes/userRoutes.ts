import { Router } from 'express';
import { getUsers } from '../controllers/userController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', protect, authorize('admin'), getUsers);

export default router;
