import { Response } from 'express';
import { User } from '../models/user';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const users = await User.findAll({
    attributes: ['id', 'email', 'role', 'adminId', 'createdAt']
  });
  res.json(users);
});

export const getSubordinates = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'No autorizado' });
    return;
  }

  const subordinates = await User.findAll({
    where: { adminId: req.user.id },
    attributes: ['id', 'email', 'role', 'createdAt']
  });

  res.json(subordinates);
});

export const assignAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { adminId } = req.body;

  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'No autorizado' });
    return;
  }

  const userToUpdate = await User.findByPk(id as string);
  if (!userToUpdate) {
    res.status(404).json({ message: 'Usuario no encontrado' });
    return;
  }

  userToUpdate.adminId = adminId || null;
  await userToUpdate.save();

  res.json({
    message: 'Usuario asignado exitosamente',
    user: {
      id: userToUpdate.id,
      email: userToUpdate.email,
      role: userToUpdate.role,
      adminId: userToUpdate.adminId
    }
  });
});
