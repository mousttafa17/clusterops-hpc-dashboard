import { Request, Response } from 'express';
import { loginSchema, loginUser, registerSchema, registerUser } from '../services/auth.service';

export const register = async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const result = await registerUser(input);

  return res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: result
  });
};

export const login = async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const result = await loginUser(input);

  return res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: result
  });
};

export const me = async (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user
    }
  });
};
