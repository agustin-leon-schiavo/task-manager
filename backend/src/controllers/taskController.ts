import { Response } from 'express';
import { Task } from '../models/task';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Op } from 'sequelize';

export const getAllTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, priority, status } = req.query;

  const where: any = { userId: req.user?.id };
  if (search) {
    where.title = { [Op.iLike]: `%${search}%` };
  }
  if (priority) {
    where.priority = priority;
  }
  if (status) {
    where.status = status;
  }

  const tasks = await Task.findAll({ 
    where,
    order: [['createdAt', 'DESC']]
  });

  res.json(tasks);
});

export const getDeletedTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tasks = await Task.findAll({
    where: { 
      userId: req.user?.id,
      deletedAt: { [Op.ne]: null }
    },
    paranoid: false
  });
  res.json(tasks);
});

export const createTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description, priority, status, dueDate, userId } = req.body;
  const targetUserId = (req.user?.role === 'admin' && userId) ? userId : req.user?.id;
  const fileUrl = req.file ? req.file.path : null;

  const newTask = await Task.create({ 
    title, 
    description, 
    priority,
    status,
    dueDate: dueDate || null,
    userId: targetUserId,
    fileUrl
  } as any);
  
  res.status(201).json(newTask);
});

export const updateTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, status, priority, dueDate, userId } = req.body;
  
  const task = await Task.findOne({
    where: { id: id as string, userId: req.user?.id }
  });

  if (!task) {
    res.status(404).json({ message: 'Task not found or not authorized' });
    return;
  }

  const updateData: any = { 
    title, 
    description, 
    status, 
    priority,
    dueDate: dueDate || null
  };
  if (req.user?.role === 'admin' && userId) updateData.userId = userId;
  if (req.file) updateData.fileUrl = req.file.path;

  await task.update(updateData);
  res.json(task);
});

export const restoreTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  const task = await Task.findOne({
    where: { id: id as string, userId: req.user?.id },
    paranoid: false
  });

  if (!task) {
    res.status(404).json({ message: 'Task not found in recycle bin' });
    return;
  }

  await task.restore();
  res.json({ message: 'Task restored successfully', task });
});

export const deleteTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  const task = await Task.findOne({
    where: { id: id as string, userId: req.user?.id }
  });
  
  if (!task) {
    res.status(404).json({ message: 'Task not found or not authorized' });
    return;
  }

  await task.destroy();
  res.json({ message: 'Task moved to recycle bin' });
});

export const emptyRecycleBin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const deletedCount = await Task.destroy({
    where: {
      userId: req.user?.id,
      deletedAt: {
        [Op.ne]: null
      }
    },
    force: true
  });

  res.json({ 
    message: 'Recycle bin emptied successfully', 
    deletedCount 
  });
});
