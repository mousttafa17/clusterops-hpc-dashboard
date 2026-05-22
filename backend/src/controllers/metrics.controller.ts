import { Request, Response } from 'express';
import { getOverviewMetrics, getPrometheusMetrics } from '../services/metrics.service';

export const getOverviewMetricsController = async (_req: Request, res: Response) => {
  const metrics = await getOverviewMetrics();

  return res.status(200).json({
    success: true,
    data: metrics
  });
};

export const getPrometheusMetricsController = async (_req: Request, res: Response) => {
  const metrics = await getPrometheusMetrics();

  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  return res.status(200).send(metrics);
};
