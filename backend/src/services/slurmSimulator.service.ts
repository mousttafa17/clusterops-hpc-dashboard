import { IJobDocument, JobStatus } from '../models/Job.model';
import { INodeDocument } from '../models/Node.model';

export type SlurmCommandName = 'sbatch' | 'squeue' | 'scancel' | 'sinfo';

export const generateSlurmJobId = (): string => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `SLURM-${timestamp}-${random}`;
};

export const mapApiActionToSlurmCommand = (action: SlurmCommandName): string => {
  const commandMap: Record<SlurmCommandName, string> = {
    sbatch: 'POST /api/jobs',
    squeue: 'GET /api/jobs',
    scancel: 'PATCH /api/jobs/:id/cancel',
    sinfo: 'GET /api/nodes'
  };

  return commandMap[action];
};

export const buildSubmissionLog = (job: IJobDocument): string => {
  return [
    `[sbatch] Submitted batch job ${job.slurmJobId}`,
    `Requested resources: ${job.cpus} CPU(s), ${job.memoryGb}GB RAM, ${job.gpus} GPU(s)`,
    `Estimated runtime: ${job.estimatedRuntimeSeconds}s`
  ].join(' | ');
};

export const buildStartLog = (job: IJobDocument, node: INodeDocument): string => {
  return [
    `[squeue] Job ${job.slurmJobId} moved from queued to running.`,
    `Assigned node: ${node.name}`,
    `Resources reserved: ${job.cpus} CPU(s), ${job.memoryGb}GB RAM, ${job.gpus} GPU(s)`
  ].join(' | ');
};

export const buildCompletionOutput = (job: IJobDocument, nodeName: string, status: JobStatus): string => {
  const heading = status === 'completed' ? 'Job completed successfully.' : 'Job failed during simulated execution.';

  return [
    heading,
    `Slurm Job ID: ${job.slurmJobId}`,
    `Job Name: ${job.jobName}`,
    `Node: ${nodeName}`,
    `Requested CPUs: ${job.cpus}`,
    `Requested Memory: ${job.memoryGb}GB`,
    `Requested GPUs: ${job.gpus}`,
    '',
    '--- Simulated Script ---',
    job.script,
    '',
    '--- Simulated Output ---',
    status === 'completed'
      ? 'Execution finished. Results were written to the simulated job output buffer.'
      : 'Execution stopped because the simulator produced a controlled failure.'
  ].join('\n');
};
