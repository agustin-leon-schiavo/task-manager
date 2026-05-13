import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const taskValidationRules = [
  body('title')
    .if((_, { req }) => req.method === 'POST' || req.body.title !== undefined)
    .notEmpty().withMessage('El título es obligatorio')
    .isString().withMessage('El título debe ser un texto')
    .isLength({ max: 100 }).withMessage('El título no puede exceder los 100 caracteres'),
  
  body('description')
    .optional()
    .isString().withMessage('La descripción debe ser un texto'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('La prioridad debe ser: low, medium o high'),
  
  body('completed')
    .optional()
    .isBoolean().withMessage('El campo completed debe ser un valor booleano')
];

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  return res.status(400).json({
    errors: errors.array().map(err => ({
      field: (err as any).path,
      message: err.msg
    }))
  });
};
