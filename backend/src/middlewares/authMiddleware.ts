import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user';
import { asyncHandler } from '../utils/asyncHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_provisoria';

interface JwtPayload {
  id: string;
}

export interface AuthRequest extends Request {
  user?: User;
}

export const protect = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      }) as User;

      if (!req.user) {
        res.status(401).json({ message: 'Usuario no encontrado' });
        return;
      }

      next();
    } catch (error) {
      res.status(401).json({ message: 'Token no válido' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'No hay token, autorización denegada' });
  }
});

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `El rol ${req.user?.role} no tiene permiso para acceder a esta ruta` 
      });
    }
    next();
  };
};
