import { z } from 'zod';
import { Types } from 'mongoose';
import { Job, JobStatus } from '../models/Job.model';
import { createAuditLog } from './audit.service';
import { releaseNodeResources } from './scheduler.service';
import { buildSubmissionLog, generateSlurmJobId } from './slurmSimulator.service';

export const createJobSchema = z.object({
  jobName: z.string().min(2).max(120),
  script: z.string().min(1).max(10000),
  cpus: z.number().int().min(1).max(256),
  memoryGb: z.number().int().min(1).max(2048),
  gpus: z.number().int().min(0).max(16).default(0),
  estimatedRuntimeSeconds: z.number().int().min(5).max(86400)
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

export const createJob = async (userId: string, input: CreateJobInput) => {
  const job = await Job.create({
    userId: new Types.ObjectId(userId),
    ...input,
    slurmJobId: generateSlurmJobId(),
    status: 'queued',
    submittedAt: new Date(),
    logs: []
  });

  job.logs.push({
    timestamp: new Date(),
    message: buildSubmissionLog(job)
  });

  await job.save();

  await createAuditLog({
    actorUserId: userId,
    action: 'JOB_SUBMITTED',
    resourceType: 'Job',
    resourceId: String(job._id),
    metadata: {
      slurmJobId: job.slurmJobId,
      jobName: job.jobName,
      cpus: job.cpus,
      memoryGb: job.memoryGb,
      gpus: job.gpus
    }
  });

  return job;
};

export const listJobs = async (userId: string, role: string, status?: JobStatus) => {
  const query: Record<string, unknown> = {};

  if (role !== 'admin') {
    query.userId = userId;
  }

  if (status) {
    query.status = status;
  }

  return Job.find(query)
    .populate('userId', 'name email role')
    .populate('assignedNodeId', 'name status')
    .sort({ submittedAt: -1 });
};

export const getJobById = async (jobId: string, userId: string, role: string) => {
  const job = await Job.findById(jobId)
    .populate('userId', 'name email role')
    .populate('assignedNodeId', 'name status totalCpus availableCpus totalMemoryGb availableMemoryGb totalGpus availableGpus');

  if (!job) {
    const error = new Error('Job not found');
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  const ownerId = typeof job.userId === 'object' && '_id' in job.userId ? String(job.userId._id) : String(job.userId);

  if (role !== 'admin' && ownerId !== userId) {
    const error = new Error('You are not allowed to access this job');
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }

  return job;
};

export const cancelJob = async (jobId: string, userId: string, role: string) => {
  const job = await Job.findById(jobId);

  if (!job) {
    const error = new Error('Job not found');
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  if (role !== 'admin' && String(job.userId) !== userId) {
    const error = new Error('You are not allowed to cancel this job');
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }

  if (['completed', 'failed', 'cancelled'].includes(job.status)) {
    const error = new Error(`Cannot cancel a job with status ${job.status}`);
    (error as Error & { statusCode?: number }).statusCode = 400;
    throw error;
  }

  const previousStatus = job.status;

  if (job.status === 'running') {
    await releaseNodeResources(job);
  }

  job.status = 'cancelled';
  job.completedAt = new Date();
  job.logs.push({
    timestamp: new Date(),
    message:
      previousStatus === 'running'
        ? 'Job cancelled by user/admin while running. Reserved node resources were released.'
        : 'Job cancelled by user/admin while queued.'
  });

  await job.save();

  await createAuditLog({
    actorUserId: userId,
    action: 'JOB_CANCELLED',
    resourceType: 'Job',
    resourceId: String(job._id),
    metadata: { previousStatus, slurmJobId: job.slurmJobId }
  });

  return job;
};
