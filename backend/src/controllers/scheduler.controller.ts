import { Request, Response } from 'express';
import { getSchedulerStatus, tickScheduler } from '../services/scheduler.service';

export const getSchedulerStatusController = async (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: {
      scheduler: getSchedulerStatus()
    }
  });
};

export const tickSchedulerController = async (_req: Request, res: Response) => {
  const result = await tickScheduler();

  return res.status(200).json({
    success: true,
    message: 'Scheduler tick executed successfully',
    data: result
  });
};
