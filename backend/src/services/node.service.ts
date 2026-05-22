import { z } from 'zod';
import { Node } from '../models/Node.model';
import { createAuditLog } from './audit.service';

export const createNodeSchema = z.object({
  name: z.string().min(2).max(80),
  totalCpus: z.number().int().min(1).max(1024),
  totalMemoryGb: z.number().int().min(1).max(8192),
  totalGpus: z.number().int().min(0).max(64).default(0)
});

export const updateNodeStatusSchema = z.object({
  status: z.enum(['online', 'offline', 'draining'])
});

export type CreateNodeInput = z.infer<typeof createNodeSchema>;

export const listNodes = async () => {
  return Node.find().populate('currentJobs', 'jobName status slurmJobId').sort({ name: 1 });
};

export const createNode = async (userId: string, input: CreateNodeInput) => {
  const node = await Node.create({
    name: input.name,
    status: 'online',
    totalCpus: input.totalCpus,
    availableCpus: input.totalCpus,
    totalMemoryGb: input.totalMemoryGb,
    availableMemoryGb: input.totalMemoryGb,
    totalGpus: input.totalGpus,
    availableGpus: input.totalGpus,
    currentJobs: [],
    lastHeartbeat: new Date()
  });

  await createAuditLog({
    actorUserId: userId,
    action: 'NODE_CREATED',
    resourceType: 'Node',
    resourceId: String(node._id),
    metadata: { name: node.name }
  });

  return node;
};

export const updateNodeStatus = async (userId: string, nodeId: string, status: 'online' | 'offline' | 'draining') => {
  const node = await Node.findById(nodeId);

  if (!node) {
    const error = new Error('Node not found');
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  node.status = status;
  node.lastHeartbeat = new Date();
  await node.save();

  await createAuditLog({
    actorUserId: userId,
    action: 'NODE_STATUS_UPDATED',
    resourceType: 'Node',
    resourceId: String(node._id),
    metadata: { status }
  });

  return node;
};
