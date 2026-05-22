import { NextFunction, Request, Response } from 'express';
import { User } from '../models/User.model';
import { verifyToken } from '../utils/jwt';

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('Authentication required');
      (error as Error & { statusCode?: number }).statusCode = 401;
      throw error;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    const user = await User.findById(payload.userId);

    if (!user) {
      const error = new Error('User no longer exists');
      (error as Error & { statusCode?: number }).statusCode = 401;
      throw error;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
