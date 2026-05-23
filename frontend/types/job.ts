export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type JobStatusFilter = JobStatus | "all";

export type JobUser = {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

export type JobNode = {
  _id: string;
  name: string;
  status: string;
};

export type JobLogEntry = {
  timestamp: string;
  message: string;
};

export type SubmitJobInput = {
  jobName: string;
  script: string;
  cpus: number;
  memoryGb: number;
  gpus: number;
  estimatedRuntimeSeconds: number;
};

export type Job = SubmitJobInput & {
  _id: string;
  status: JobStatus;
  slurmJobId: string;
  userId?: string | JobUser;
  assignedNodeId?: string | JobNode;
  submittedAt: string;
  startedAt?: string;
  completedAt?: string;
  logs?: JobLogEntry[];
  output?: string;
  errorMessage?: string;
};

export type SubmitJobResponse = {
  success: boolean;
  message?: string;
  data: {
    job: Job;
  };
};

export type ListJobsResponse = {
  success: boolean;
  count: number;
  data: {
    jobs: Job[];
  };
};

export type CancelJobResponse = SubmitJobResponse;
