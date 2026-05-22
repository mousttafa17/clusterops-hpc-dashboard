import { Types } from 'mongoose';
import { AuditLog } from '../models/AuditLog.model';

interface CreateAuditLogInput {
  actorUserId?: Types.ObjectId | string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export const createAuditLog = async (input: CreateAuditLogInput) => {
  return AuditLog.create({
    actorUserId: input.actorUserId,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    metadata: input.metadata ?? {}
  });
};
