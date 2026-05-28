import { Request, Response } from 'express';
import { User } from '../models/user';
import { asyncHandler } from '../utils/asyncHandler';
import { sendVerificationEmail } from '../utils/emailService';
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

  // Generar código OTP de 6 dígitos
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

  const user = await User.create({
    email,
    password,
    role,
    isVerified: false,
    verificationCode,
    verificationCodeExpires,
  } as any);

  // Enviar correo de forma asíncrona
  await sendVerificationEmail(email, verificationCode);

  res.status(201).json({
    message: 'Registro exitoso. Se ha enviado un código de verificación a tu correo.',
    email: user.email,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });

  if (user && (await user.comparePassword(password))) {
    if (!user.isVerified) {
      res.status(403).json({
        message: 'Tu cuenta no está verificada. Por favor verifica tu correo.',
        needsVerification: true,
        email: user.email,
      });
      return;
    }

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

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) {
    res.status(400).json({ message: 'Email y código son requeridos' });
    return;
  }

  const user = await User.findOne({ where: { email } });

  if (!user) {
    res.status(404).json({ message: 'Usuario no encontrado' });
    return;
  }

  if (user.isVerified) {
    res.status(400).json({ message: 'El usuario ya está verificado' });
    return;
  }

  if (user.verificationCode !== code) {
    res.status(400).json({ message: 'Código de verificación incorrecto' });
    return;
  }

  if (!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
    res.status(400).json({ message: 'El código ha expirado. Por favor solicita uno nuevo.' });
    return;
  }

  // Marcar como verificado y limpiar campos temporales
  user.isVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  await user.save();

  res.status(200).json({
    message: 'Cuenta verificada con éxito',
    token: generateToken(user.id),
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
});

export const resendCode = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: 'El email es requerido' });
    return;
  }

  const user = await User.findOne({ where: { email } });

  if (!user) {
    res.status(404).json({ message: 'Usuario no encontrado' });
    return;
  }

  if (user.isVerified) {
    res.status(400).json({ message: 'El usuario ya está verificado' });
    return;
  }

  // Generar nuevo código
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

  user.verificationCode = verificationCode;
  user.verificationCodeExpires = verificationCodeExpires;
  await user.save();

  await sendVerificationEmail(email, verificationCode);

  res.status(200).json({
    message: 'Se ha enviado un nuevo código de verificación a tu correo.',
  });
});
