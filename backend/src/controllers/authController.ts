import { Request, Response } from 'express';
import { User } from '../models/user';
import { asyncHandler } from '../utils/asyncHandler';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_provisoria';

const generateToken = (id: string) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d',
  });
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  const userExists = await User.findOne({ where: { email } });

  if (userExists) {
    res.status(400).json({ message: 'El usuario ya existe' });
    return;
  }

  const user = await User.create({ email, password, role } as any);

  res.status(201).json({
    id: user.id,
    email: user.email,
    role: user.role,
    token: generateToken(user.id),
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });

  if (user && (await user.comparePassword(password))) {
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } else {
    res.status(401).json({ message: 'Email o contraseña inválidos' });
  }
});
