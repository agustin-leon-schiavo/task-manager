import { Router } from 'express';
import { getAllTasks, createTask, updateTask, deleteTask, getDeletedTasks, restoreTask, emptyRecycleBin } from '../controllers/taskController';
import { taskValidationRules, validate } from '../middlewares/taskValidator';
import { protect } from '../middlewares/authMiddleware';
import { upload } from '../config/cloudinary';

const router = Router();

router.use(protect);

router.get('/', getAllTasks);

router.get('/deleted', getDeletedTasks);
router.delete('/empty', emptyRecycleBin);

router.post('/', 
  upload.single('file'),
  taskValidationRules, 
  validate, 
  createTask
);

router.put('/:id', 
  upload.single('file'),
  taskValidationRules, 
  validate, 
  updateTask
);

router.patch('/:id/restore', restoreTask);

router.delete('/:id', deleteTask);

export default router;
