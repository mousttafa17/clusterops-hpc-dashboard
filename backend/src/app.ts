import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import jobsRoutes from './routes/jobs.routes';
import nodesRoutes from './routes/nodes.routes';
import metricsRoutes from './routes/metrics.routes';
import schedulerRoutes from './routes/scheduler.routes';
import adminRoutes from './routes/admin.routes';
import { errorMiddleware } from './middleware/error.middleware';
import { notFoundMiddleware } from './middleware/notFound.middleware';
import { getPrometheusMetricsController } from './controllers/metrics.controller';
import { asyncHandler } from './utils/asyncHandler';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

app.get('/health', (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  return res.status(databaseConnected ? 200 : 503).json({
    success: true,
    status: databaseConnected ? 'ok' : 'degraded',
    message: 'ClusterOps backend is healthy',
    database: {
      connected: databaseConnected,
      readyState: mongoose.connection.readyState
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/metrics', asyncHandler(getPrometheusMetricsController));

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/nodes', nodesRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
