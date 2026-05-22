import { app } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { startScheduler, stopScheduler } from './services/scheduler.service';

const startServer = async () => {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`🚀 ClusterOps backend running on http://localhost:${env.PORT}`);
    startScheduler();
  });
};

void startServer();

process.on('SIGINT', () => {
  stopScheduler();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopScheduler();
  process.exit(0);
});
