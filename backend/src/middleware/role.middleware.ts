import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../models/User.model';

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      const error = new Error('Authentication required');
      (error as Error & { statusCode?: number }).statusCode = 401;
      return next(error);
    }

    if (!roles.includes(req.user.role)) {
      const error = new Error('Insufficient permissions');
      (error as Error & { statusCode?: number }).statusCode = 403;
      return next(error);
    }

    return next();
  };
};
