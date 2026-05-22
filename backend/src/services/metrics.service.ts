import { Job } from '../models/Job.model';
import { Node } from '../models/Node.model';
import { User } from '../models/User.model';

export const getOverviewMetrics = async () => {
  const [
    totalJobs,
    queuedJobs,
    runningJobs,
    completedJobs,
    failedJobs,
    cancelledJobs,
    totalUsers,
    nodes
  ] = await Promise.all([
    Job.countDocuments(),
    Job.countDocuments({ status: 'queued' }),
    Job.countDocuments({ status: 'running' }),
    Job.countDocuments({ status: 'completed' }),
    Job.countDocuments({ status: 'failed' }),
    Job.countDocuments({ status: 'cancelled' }),
    User.countDocuments(),
    Node.find()
  ]);

  const totalNodes = nodes.length;
  const onlineNodes = nodes.filter((node) => node.status === 'online').length;

  const clusterTotals = nodes.reduce(
    (acc, node) => {
      acc.totalCpus += node.totalCpus;
      acc.availableCpus += node.availableCpus;
      acc.totalMemoryGb += node.totalMemoryGb;
      acc.availableMemoryGb += node.availableMemoryGb;
      acc.totalGpus += node.totalGpus;
      acc.availableGpus += node.availableGpus;
      return acc;
    },
    {
      totalCpus: 0,
      availableCpus: 0,
      totalMemoryGb: 0,
      availableMemoryGb: 0,
      totalGpus: 0,
      availableGpus: 0
    }
  );

  return {
    jobs: {
      total: totalJobs,
      queued: queuedJobs,
      running: runningJobs,
      completed: completedJobs,
      failed: failedJobs,
      cancelled: cancelledJobs
    },
    users: {
      total: totalUsers
    },
    cluster: {
      totalNodes,
      onlineNodes,
      ...clusterTotals
    }
  };
};

export const getPrometheusMetrics = async (): Promise<string> => {
  const overview = await getOverviewMetrics();

  return [
    '# HELP clusterops_jobs_total Total number of jobs submitted.',
    '# TYPE clusterops_jobs_total gauge',
    `clusterops_jobs_total ${overview.jobs.total}`,
    `clusterops_jobs_queued ${overview.jobs.queued}`,
    `clusterops_jobs_running ${overview.jobs.running}`,
    `clusterops_jobs_completed ${overview.jobs.completed}`,
    `clusterops_jobs_failed ${overview.jobs.failed}`,
    `clusterops_jobs_cancelled ${overview.jobs.cancelled}`,
    '# HELP clusterops_nodes_total Total number of cluster nodes.',
    '# TYPE clusterops_nodes_total gauge',
    `clusterops_nodes_total ${overview.cluster.totalNodes}`,
    `clusterops_nodes_online ${overview.cluster.onlineNodes}`,
    `clusterops_cpu_total ${overview.cluster.totalCpus}`,
    `clusterops_cpu_available ${overview.cluster.availableCpus}`,
    `clusterops_memory_gb_total ${overview.cluster.totalMemoryGb}`,
    `clusterops_memory_gb_available ${overview.cluster.availableMemoryGb}`,
    `clusterops_gpu_total ${overview.cluster.totalGpus}`,
    `clusterops_gpu_available ${overview.cluster.availableGpus}`
  ].join('\n');
};
