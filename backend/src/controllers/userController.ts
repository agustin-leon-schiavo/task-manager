import { Response } from 'express';
import { User } from '../models/user';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const users = await User.findAll({
    attributes: ['id', 'email', 'role', 'createdAt']
  });
  res.json(users);
});
