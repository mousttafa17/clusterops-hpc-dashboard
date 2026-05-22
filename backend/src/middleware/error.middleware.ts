import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

interface AppError extends Error {
  statusCode?: number;
  code?: number;
}

export const errorMiddleware = (
  error: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.flatten().fieldErrors
    });
  }

  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate resource already exists'
    });
  }

  const statusCode = error.statusCode ?? 500;

  return res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error',
    stack: env.NODE_ENV === 'development' ? error.stack : undefined
  });
};
