import { Job } from "./job";

export type NodeStatus = "online" | "offline" | "draining";

export type ClusterNode = {
  _id: string;
  name: string;
  status: NodeStatus;
  totalCpus: number;
  availableCpus: number;
  totalMemoryGb: number;
  availableMemoryGb: number;
  totalGpus: number;
  availableGpus: number;
  currentJobs: Pick<Job, "_id" | "jobName" | "status" | "slurmJobId">[];
  lastHeartbeat: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateNodeInput = {
  name: string;
  totalCpus: number;
  totalMemoryGb: number;
  totalGpus: number;
};

export type ListNodesResponse = {
  success: boolean;
  count: number;
  data: {
    nodes: ClusterNode[];
  };
};

export type NodeResponse = {
  success: boolean;
  message?: string;
  data: {
    node: ClusterNode;
  };
};
