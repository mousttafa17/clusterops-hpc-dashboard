import { Request, Response } from 'express';
import { z } from 'zod';
import { cancelJob, createJob, createJobSchema, getJobById, listJobs } from '../services/job.service';
import { JobStatus } from '../models/Job.model';

const listJobsQuerySchema = z.object({
  status: z.enum(['queued', 'running', 'completed', 'failed', 'cancelled']).optional()
});

export const createJobController = async (req: Request, res: Response) => {
  const input = createJobSchema.parse(req.body);
  const job = await createJob(String(req.user!._id), input);

  return res.status(201).json({
    success: true,
    message: 'Job submitted successfully',
    data: { job }
  });
};

export const listJobsController = async (req: Request, res: Response) => {
  const query = listJobsQuerySchema.parse(req.query);
  const jobs = await listJobs(String(req.user!._id), req.user!.role, query.status as JobStatus | undefined);

  return res.status(200).json({
    success: true,
    count: jobs.length,
    data: { jobs }
  });
};

export const getJobController = async (req: Request, res: Response) => {
  const job = await getJobById(String(req.params.id), String(req.user!._id), req.user!.role);

  return res.status(200).json({
    success: true,
    data: { job }
  });
};

export const cancelJobController = async (req: Request, res: Response) => {
  const job = await cancelJob(String(req.params.id), String(req.user!._id), req.user!.role);

  return res.status(200).json({
    success: true,
    message: 'Job cancelled successfully',
    data: { job }
  });
};
