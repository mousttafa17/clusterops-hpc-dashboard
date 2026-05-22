import { Types } from 'mongoose';
import { env } from '../config/env';
import { Job, IJobDocument, JobStatus } from '../models/Job.model';
import { Node, INodeDocument } from '../models/Node.model';
import { createAuditLog } from './audit.service';
import { buildCompletionOutput, buildStartLog } from './slurmSimulator.service';

type SchedulerTimer = NodeJS.Timeout | null;

type SchedulerStatus = {
  enabled: boolean;
  running: boolean;
  queueIntervalMs: number;
  completionIntervalMs: number;
  maxSimulatedRuntimeMs: number;
  failureRate: number;
};

let queueTimer: SchedulerTimer = null;
let completionTimer: SchedulerTimer = null;
let isProcessingQueue = false;
let isUpdatingRunningJobs = false;

const appendLog = (job: IJobDocument, message: string) => {
  job.logs.push({
    timestamp: new Date(),
    message
  });
};

const findAvailableNodeForJob = async (job: IJobDocument): Promise<INodeDocument | null> => {
  return Node.findOne({
    status: 'online',
    availableCpus: { $gte: job.cpus },
    availableMemoryGb: { $gte: job.memoryGb },
    availableGpus: { $gte: job.gpus }
  }).sort({ availableGpus: -1, availableCpus: -1, availableMemoryGb: -1 });
};

const reserveNodeResources = async (node: INodeDocument, job: IJobDocument): Promise<INodeDocument | null> => {
  return Node.findOneAndUpdate(
    {
      _id: node._id,
      status: 'online',
      availableCpus: { $gte: job.cpus },
      availableMemoryGb: { $gte: job.memoryGb },
      availableGpus: { $gte: job.gpus }
    },
    {
      $inc: {
        availableCpus: -job.cpus,
        availableMemoryGb: -job.memoryGb,
        availableGpus: -job.gpus
      },
      $addToSet: { currentJobs: job._id },
      $set: { lastHeartbeat: new Date() }
    },
    { new: true }
  );
};

export const releaseNodeResources = async (job: IJobDocument): Promise<void> => {
  if (!job.assignedNodeId) {
    return;
  }

  const node = await Node.findById(job.assignedNodeId);

  if (!node) {
    return;
  }

  node.availableCpus = Math.min(node.totalCpus, node.availableCpus + job.cpus);
  node.availableMemoryGb = Math.min(node.totalMemoryGb, node.availableMemoryGb + job.memoryGb);
  node.availableGpus = Math.min(node.totalGpus, node.availableGpus + job.gpus);
  node.currentJobs = node.currentJobs.filter((currentJobId: Types.ObjectId) => String(currentJobId) !== String(job._id));
  node.lastHeartbeat = new Date();

  await node.save();
};

export const processQueuedJobs = async (): Promise<number> => {
  if (isProcessingQueue) {
    return 0;
  }

  isProcessingQueue = true;
  let startedJobs = 0;

  try {
    const queuedJobs = await Job.find({ status: 'queued' }).sort({ submittedAt: 1 }).limit(25);

    for (const job of queuedJobs) {
      const node = await findAvailableNodeForJob(job);

      if (!node) {
        if (!job.logs.some((entry) => entry.message.includes('Waiting for available resources'))) {
          appendLog(job, 'Waiting for available resources. No online node currently satisfies this job request.');
          await job.save();
        }
        continue;
      }

      const reservedNode = await reserveNodeResources(node, job);

      if (!reservedNode) {
        continue;
      }

      job.status = 'running';
      job.assignedNodeId = reservedNode._id as Types.ObjectId;
      job.startedAt = new Date();
      appendLog(job, buildStartLog(job, reservedNode));
      await job.save();

      await createAuditLog({
        action: 'JOB_STARTED',
        resourceType: 'Job',
        resourceId: String(job._id),
        metadata: {
          slurmJobId: job.slurmJobId,
          nodeName: reservedNode.name,
          nodeId: String(reservedNode._id)
        }
      });

      startedJobs += 1;
    }
  } finally {
    isProcessingQueue = false;
  }

  return startedJobs;
};

const getSimulatedRuntimeMs = (job: IJobDocument): number => {
  return Math.min(job.estimatedRuntimeSeconds * 1000, env.SCHEDULER_MAX_SIMULATED_RUNTIME_MS);
};

const shouldFailJob = (): boolean => {
  return Math.random() < env.SCHEDULER_FAILURE_RATE;
};

export const updateRunningJobs = async (): Promise<number> => {
  if (isUpdatingRunningJobs) {
    return 0;
  }

  isUpdatingRunningJobs = true;
  let finishedJobs = 0;

  try {
    const runningJobs = await Job.find({ status: 'running' });

    for (const job of runningJobs) {
      if (!job.startedAt) {
        continue;
      }

      const runtimeMs = getSimulatedRuntimeMs(job);
      const hasFinished = Date.now() - job.startedAt.getTime() >= runtimeMs;

      if (!hasFinished) {
        continue;
      }

      const finalStatus: JobStatus = shouldFailJob() ? 'failed' : 'completed';
      const assignedNode = job.assignedNodeId ? await Node.findById(job.assignedNodeId) : null;
      const nodeName = assignedNode?.name ?? 'unknown-node';

      job.status = finalStatus;
      job.completedAt = new Date();
      job.output = buildCompletionOutput(job, nodeName, finalStatus);

      if (finalStatus === 'failed') {
        job.errorMessage = 'Simulated scheduler failure. This controlled failure is used for dashboard/testing realism.';
      }

      appendLog(
        job,
        finalStatus === 'completed'
          ? `[squeue] Job ${job.slurmJobId} completed. Resources released from ${nodeName}.`
          : `[squeue] Job ${job.slurmJobId} failed. Resources released from ${nodeName}.`
      );

      await releaseNodeResources(job);
      await job.save();

      await createAuditLog({
        action: finalStatus === 'completed' ? 'JOB_COMPLETED' : 'JOB_FAILED',
        resourceType: 'Job',
        resourceId: String(job._id),
        metadata: {
          slurmJobId: job.slurmJobId,
          finalStatus,
          nodeName
        }
      });

      finishedJobs += 1;
    }
  } finally {
    isUpdatingRunningJobs = false;
  }

  return finishedJobs;
};

export const tickScheduler = async (): Promise<{ startedJobs: number; finishedJobs: number }> => {
  const startedJobs = await processQueuedJobs();
  const finishedJobs = await updateRunningJobs();

  return { startedJobs, finishedJobs };
};

export const startScheduler = (): void => {
  if (!env.SCHEDULER_ENABLED) {
    console.log('⏸️  ClusterOps scheduler disabled by SCHEDULER_ENABLED=false');
    return;
  }

  if (queueTimer || completionTimer) {
    return;
  }

  queueTimer = setInterval(() => {
    void processQueuedJobs().catch((error) => {
      console.error('❌ Scheduler queue processing failed:', error);
    });
  }, env.SCHEDULER_QUEUE_INTERVAL_MS);

  completionTimer = setInterval(() => {
    void updateRunningJobs().catch((error) => {
      console.error('❌ Scheduler running-job update failed:', error);
    });
  }, env.SCHEDULER_COMPLETION_INTERVAL_MS);

  void tickScheduler().catch((error) => {
    console.error('❌ Initial scheduler tick failed:', error);
  });

  console.log(
    `🧠 ClusterOps scheduler started: queue=${env.SCHEDULER_QUEUE_INTERVAL_MS}ms, completion=${env.SCHEDULER_COMPLETION_INTERVAL_MS}ms`
  );
};

export const stopScheduler = (): void => {
  if (queueTimer) {
    clearInterval(queueTimer);
    queueTimer = null;
  }

  if (completionTimer) {
    clearInterval(completionTimer);
    completionTimer = null;
  }

  console.log('🛑 ClusterOps scheduler stopped');
};

export const getSchedulerStatus = (): SchedulerStatus => {
  return {
    enabled: env.SCHEDULER_ENABLED,
    running: Boolean(queueTimer && completionTimer),
    queueIntervalMs: env.SCHEDULER_QUEUE_INTERVAL_MS,
    completionIntervalMs: env.SCHEDULER_COMPLETION_INTERVAL_MS,
    maxSimulatedRuntimeMs: env.SCHEDULER_MAX_SIMULATED_RUNTIME_MS,
    failureRate: env.SCHEDULER_FAILURE_RATE
  };
};
