import { Router } from 'express';
import { getUsers, getSubordinates, assignAdmin } from '../controllers/userController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', getUsers);
router.get('/subordinates', getSubordinates);
router.put('/:id/assign-admin', assignAdmin);

export default router;
