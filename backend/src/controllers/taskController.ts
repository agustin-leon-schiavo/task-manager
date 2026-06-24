import { Response } from 'express';
import { Task } from '../models/task';
import { User } from '../models/user';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Op } from 'sequelize';

// Helper to check if a user can access/modify a task
const authorizeTaskAccess = async (taskUserId: string, currentUser: User): Promise<boolean> => {
  if (taskUserId === currentUser.id) return true;
  if (currentUser.role === 'admin') {
    const owner = await User.findOne({ where: { id: taskUserId, adminId: currentUser.id } });
    if (owner) return true;
  }
  return false;
};

// Helper to check authorization and resolve target user ID (for admin/subordinate relations)
const getTargetUserId = async (req: AuthRequest, requestedUserId: any): Promise<string | null> => {
  const currentUserId = req.user?.id;
  if (!currentUserId) return null;

  if (req.user?.role === 'admin' && requestedUserId && requestedUserId !== currentUserId) {
    const subordinate = await User.findOne({
      where: { id: requestedUserId as string, adminId: currentUserId }
    });
    if (subordinate) {
      return subordinate.id;
    }
    return null; // Not authorized to access this user
  }

  return currentUserId;
};

export const getAllTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, priority, status, userId } = req.query;

  const targetUserId = await getTargetUserId(req, userId);
  if (!targetUserId) {
    res.status(403).json({ message: 'No autorizado para ver las tareas de este usuario' });
    return;
  }

  const where: any = { userId: targetUserId };
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
  const { userId } = req.query;

  const targetUserId = await getTargetUserId(req, userId);
  if (!targetUserId) {
    res.status(403).json({ message: 'No autorizado' });
    return;
  }

  const tasks = await Task.findAll({
    where: { 
      userId: targetUserId,
      deletedAt: { [Op.ne]: null }
    },
    paranoid: false
  });
  res.json(tasks);
});

export const createTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description, priority, status, dueDate, subtasks, userId } = req.body;
  
  const targetUserId = await getTargetUserId(req, userId);
  if (!targetUserId) {
    res.status(403).json({ message: 'No autorizado' });
    return;
  }

  const fileUrl = req.file ? req.file.path : null;
  const parsedSubtasks = subtasks ? (typeof subtasks === 'string' ? JSON.parse(subtasks) : subtasks) : [];

  const newTask = await Task.create({ 
    title, 
    description, 
    priority,
    status,
    dueDate: dueDate || null,
    subtasks: parsedSubtasks,
    userId: targetUserId,
    fileUrl
  } as any);
  
  res.status(201).json(newTask);
});

export const updateTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, status, priority, dueDate, subtasks, userId } = req.body;
  
  const task = await Task.findOne({
    where: { id: id as string }
  });

  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }

  const isAuthorized = await authorizeTaskAccess(task.userId, req.user!);
  if (!isAuthorized) {
    res.status(403).json({ message: 'No autorizado para modificar esta tarea' });
    return;
  }

  const parsedSubtasks = subtasks !== undefined 
    ? (typeof subtasks === 'string' ? JSON.parse(subtasks) : subtasks) 
    : undefined;

  const updateData: any = { 
    title, 
    description, 
    status, 
    priority,
    dueDate: dueDate || null
  };
  if (parsedSubtasks !== undefined) {
    updateData.subtasks = parsedSubtasks;
  }
  
  if (req.user?.role === 'admin' && userId) {
    const targetUserId = await getTargetUserId(req, userId);
    if (!targetUserId) {
      res.status(403).json({ message: 'No autorizado para asignar tareas a este usuario' });
      return;
    }
    updateData.userId = targetUserId;
  }

  if (req.file) updateData.fileUrl = req.file.path;

  await task.update(updateData);
  res.json(task);
});

export const restoreTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  const task = await Task.findOne({
    where: { id: id as string },
    paranoid: false
  });

  if (!task) {
    res.status(404).json({ message: 'Task not found in recycle bin' });
    return;
  }

  const isAuthorized = await authorizeTaskAccess(task.userId, req.user!);
  if (!isAuthorized) {
    res.status(403).json({ message: 'No autorizado' });
    return;
  }

  await task.restore();
  res.json({ message: 'Task restored successfully', task });
});

export const deleteTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  const task = await Task.findOne({
    where: { id: id as string }
  });
  
  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }

  const isAuthorized = await authorizeTaskAccess(task.userId, req.user!);
  if (!isAuthorized) {
    res.status(403).json({ message: 'No autorizado' });
    return;
  }

  await task.destroy();
  res.json({ message: 'Task moved to recycle bin' });
});

export const emptyRecycleBin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.query;

  const targetUserId = await getTargetUserId(req, userId);
  if (!targetUserId) {
    res.status(403).json({ message: 'No autorizado' });
    return;
  }

  const deletedCount = await Task.destroy({
    where: {
      userId: targetUserId,
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
