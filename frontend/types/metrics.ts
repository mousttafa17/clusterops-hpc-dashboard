export type MetricsOverview = {
  jobs?: {
    total?: number;
    queued?: number;
    running?: number;
    completed?: number;
    failed?: number;
    cancelled?: number;
  };
  cluster?: {
    totalNodes?: number;
    onlineNodes?: number;
    totalCpus?: number;
    availableCpus?: number;
    totalMemoryGb?: number;
    availableMemoryGb?: number;
    totalGpus?: number;
    availableGpus?: number;
  };
};