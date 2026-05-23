"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  Cpu,
  Loader2,
  PlayCircle,
  RefreshCw,
  Server,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { api, getApiErrorMessage } from "@/lib/api";
import {
  CancelJobResponse,
  Job,
  JobNode,
  JobStatus,
  JobStatusFilter,
  JobUser,
  ListJobsResponse,
} from "@/types/job";

const statusFilters: { label: string; value: JobStatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Queued", value: "queued" },
  { label: "Running", value: "running" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
  { label: "Cancelled", value: "cancelled" },
];

const statusStyles: Record<JobStatus, string> = {
  queued: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  running: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  completed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  failed: "border-red-400/30 bg-red-400/10 text-red-200",
  cancelled: "border-slate-500/40 bg-slate-700/40 text-slate-300",
};

const statusIcons = {
  queued: Clock,
  running: PlayCircle,
  completed: CheckCircle2,
  failed: XCircle,
  cancelled: Ban,
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancellingJobId, setCancellingJobId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadJobs = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) {
        setRefreshing(true);
      }

      try {
        setError("");
        const response = await api.get<ListJobsResponse>("/api/jobs", {
          params: statusFilter === "all" ? undefined : { status: statusFilter },
        });

        setJobs(response.data.data.jobs);
        setLastUpdated(new Date());
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Failed to load jobs."));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    queueMicrotask(() => {
      setLoading(true);
      void loadJobs();
    });

    const intervalId = window.setInterval(() => {
      void loadJobs();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [loadJobs]);

  const jobCounts = useMemo(() => {
    return jobs.reduce(
      (counts, job) => ({
        ...counts,
        [job.status]: counts[job.status] + 1,
      }),
      {
        queued: 0,
        running: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
      } satisfies Record<JobStatus, number>
    );
  }, [jobs]);

  async function cancelJob(job: Job) {
    setCancelError("");
    setCancellingJobId(job._id);

    try {
      await api.patch<CancelJobResponse>(`/api/jobs/${job._id}/cancel`);
      await loadJobs(true);
    } catch (err: unknown) {
      setCancelError(
        getApiErrorMessage(err, `Failed to cancel ${job.slurmJobId}.`)
      );
    } finally {
      setCancellingJobId(null);
    }
  }

  return (
    <ProtectedLayout>
      <div className="mb-8 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Jobs</h2>
          <p className="mt-2 text-slate-400">
            Track queued, running, completed, failed, and cancelled HPC workloads.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => void loadJobs(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition hover:border-cyan-400/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={refreshing ? "animate-spin" : ""} size={18} />
            Refresh
          </button>

          <Link
            href="/submit-job"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            <UploadCloud size={18} />
            Submit Job
          </Link>
        </div>
      </div>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Queued" value={jobCounts.queued} icon={Clock} />
        <SummaryCard label="Running" value={jobCounts.running} icon={Cpu} />
        <SummaryCard label="Completed" value={jobCounts.completed} icon={CheckCircle2} />
        <SummaryCard label="Failed" value={jobCounts.failed} icon={AlertCircle} />
        <SummaryCard label="Cancelled" value={jobCounts.cancelled} icon={Ban} />
      </section>

      <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  statusFilter === filter.value
                    ? "bg-cyan-400 text-slate-950"
                    : "border border-slate-700 text-slate-300 hover:border-cyan-400/70 hover:text-white"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <p className="text-sm text-slate-400">
            {lastUpdated ? `Updated ${formatTime(lastUpdated)}` : "Waiting for first refresh"}
          </p>
        </div>
      </section>

      {(error || cancelError) && (
        <div className="mb-6 flex gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <span>{error || cancelError}</span>
        </div>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-slate-300">
            <Loader2 className="animate-spin text-cyan-300" size={22} />
            Loading jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-xl bg-cyan-400/10 p-4 text-cyan-300">
              <Activity size={28} />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No jobs found</h3>
            <p className="mt-2 max-w-md text-sm text-slate-400">
              Submit a workload or switch filters to inspect another queue state.
            </p>
            <Link
              href="/submit-job"
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              <UploadCloud size={18} />
              Submit Job
            </Link>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="border-b border-slate-800 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Job</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Resources</th>
                    <th className="px-6 py-4 font-semibold">Node</th>
                    <th className="px-6 py-4 font-semibold">Owner</th>
                    <th className="px-6 py-4 font-semibold">Submitted</th>
                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {jobs.map((job) => (
                    <tr key={job._id} className="transition hover:bg-slate-950/60">
                      <td className="px-6 py-5">
                        <p className="font-semibold text-white">{job.jobName}</p>
                        <p className="mt-1 font-mono text-xs text-slate-500">
                          {job.slurmJobId}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="px-6 py-5 text-slate-300">
                        <p>{job.cpus} CPU / {job.memoryGb} GB</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {job.gpus} GPU / {job.estimatedRuntimeSeconds}s
                        </p>
                      </td>
                      <td className="px-6 py-5 text-slate-300">
                        <NodeLabel node={job.assignedNodeId} />
                      </td>
                      <td className="px-6 py-5 text-slate-300">
                        <OwnerLabel user={job.userId} />
                      </td>
                      <td className="px-6 py-5 text-slate-300">
                        {formatDate(job.submittedAt)}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <CancelButton
                          job={job}
                          cancellingJobId={cancellingJobId}
                          onCancel={cancelJob}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 xl:hidden">
              {jobs.map((job) => (
                <article
                  key={job._id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-white">{job.jobName}</h3>
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {job.slurmJobId}
                      </p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <MobileRow label="Resources" value={`${job.cpus} CPU / ${job.memoryGb} GB / ${job.gpus} GPU`} />
                    <MobileRow label="Runtime" value={`${job.estimatedRuntimeSeconds}s`} />
                    <MobileRow label="Node" value={getNodeName(job.assignedNodeId)} />
                    <MobileRow label="Owner" value={getOwnerName(job.userId)} />
                    <MobileRow label="Submitted" value={formatDate(job.submittedAt)} />
                  </div>

                  <div className="mt-4">
                    <CancelButton
                      job={job}
                      cancellingJobId={cancellingJobId}
                      onCancel={cancelJob}
                      fullWidth
                    />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </ProtectedLayout>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
  icon: typeof Activity;
};

function SummaryCard({ label, value, icon: Icon }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

type StatusBadgeProps = {
  status: JobStatus;
};

function StatusBadge({ status }: StatusBadgeProps) {
  const Icon = statusIcons[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusStyles[status]}`}
    >
      <Icon size={14} />
      {status}
    </span>
  );
}

type CancelButtonProps = {
  job: Job;
  cancellingJobId: string | null;
  onCancel: (job: Job) => Promise<void>;
  fullWidth?: boolean;
};

function CancelButton({
  job,
  cancellingJobId,
  onCancel,
  fullWidth = false,
}: CancelButtonProps) {
  const canCancel = job.status === "queued" || job.status === "running";
  const isCancelling = cancellingJobId === job._id;

  if (!canCancel) {
    return (
      <span className="inline-flex items-center justify-center rounded-xl border border-slate-800 px-4 py-2 text-xs font-medium text-slate-500">
        No action
      </span>
    );
  }

  return (
    <button
      onClick={() => void onCancel(job)}
      disabled={isCancelling}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 ${
        fullWidth ? "w-full" : ""
      }`}
    >
      {isCancelling ? <Loader2 className="animate-spin" size={16} /> : <Ban size={16} />}
      {isCancelling ? "Cancelling..." : "Cancel"}
    </button>
  );
}

type MobileRowProps = {
  label: string;
  value: string;
};

function MobileRow({ label, value }: MobileRowProps) {
  return (
    <div>
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-slate-200">{value}</p>
    </div>
  );
}

function OwnerLabel({ user }: { user?: string | JobUser }) {
  return <span>{getOwnerName(user)}</span>;
}

function NodeLabel({ node }: { node?: string | JobNode }) {
  const nodeName = getNodeName(node);

  return (
    <span className="inline-flex items-center gap-2">
      <Server size={15} className="text-slate-500" />
      {nodeName}
    </span>
  );
}

function getOwnerName(user?: string | JobUser) {
  if (!user) return "Unknown";
  if (typeof user === "string") return user;
  return user.name || user.email;
}

function getNodeName(node?: string | JobNode) {
  if (!node) return "Unassigned";
  if (typeof node === "string") return node;
  return node.name;
}

function formatDate(value?: string) {
  if (!value) return "Not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(value);
}
