import { Request, Response } from 'express';
import { AuditLog } from '../models/AuditLog.model';
import { User } from '../models/User.model';

export const listUsersController = async (_req: Request, res: Response) => {
  const users = await User.find().sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    count: users.length,
    data: { users }
  });
};

export const listAuditLogsController = async (_req: Request, res: Response) => {
  const auditLogs = await AuditLog.find()
    .populate('actorUserId', 'name email role')
    .sort({ createdAt: -1 })
    .limit(100);

  return res.status(200).json({
    success: true,
    count: auditLogs.length,
    data: { auditLogs }
  });
};
