import { z } from 'zod';
import { User } from '../models/User.model';
import { comparePassword, hashPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { createAuditLog } from './audit.service';

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  role: z.enum(['user', 'admin']).optional()
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await User.findOne({ email: input.email });

  if (existingUser) {
    const error = new Error('Email is already registered');
    (error as Error & { statusCode?: number }).statusCode = 409;
    throw error;
  }

  const passwordHash = await hashPassword(input.password);

  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role ?? 'user'
  });

  await createAuditLog({
    actorUserId: user._id,
    action: 'USER_REGISTERED',
    resourceType: 'User',
    resourceId: String(user._id),
    metadata: { email: user.email, role: user.role }
  });

  const token = signToken({ userId: String(user._id), role: user.role });

  return { user, token };
};

export const loginUser = async (input: LoginInput) => {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');

  if (!user) {
    const error = new Error('Invalid email or password');
    (error as Error & { statusCode?: number }).statusCode = 401;
    throw error;
  }

  const isMatch = await comparePassword(input.password, user.passwordHash);

  if (!isMatch) {
    const error = new Error('Invalid email or password');
    (error as Error & { statusCode?: number }).statusCode = 401;
    throw error;
  }

  await createAuditLog({
    actorUserId: user._id,
    action: 'USER_LOGGED_IN',
    resourceType: 'User',
    resourceId: String(user._id),
    metadata: { email: user.email }
  });

  const token = signToken({ userId: String(user._id), role: user.role });

  return { user, token };
};
