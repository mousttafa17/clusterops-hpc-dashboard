"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  HardDrive,
  Loader2,
  MemoryStick,
  Plus,
  RefreshCw,
  Server,
  Shield,
  Signal,
} from "lucide-react";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { api, getApiErrorMessage } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import {
  ClusterNode,
  CreateNodeInput,
  ListNodesResponse,
  NodeResponse,
  NodeStatus,
} from "@/types/node";

const initialForm: CreateNodeInput = {
  name: "compute-node-03",
  totalCpus: 16,
  totalMemoryGb: 64,
  totalGpus: 1,
};

const nodeStatuses: NodeStatus[] = ["online", "draining", "offline"];

const statusStyles: Record<NodeStatus, string> = {
  online: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  draining: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  offline: "border-red-400/30 bg-red-400/10 text-red-200",
};

export default function NodesPage() {
  const [nodes, setNodes] = useState<ClusterNode[]>([]);
  const [form, setForm] = useState<CreateNodeInput>(initialForm);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingNodeId, setUpdatingNodeId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  async function loadNodes(showSpinner = false) {
    if (showSpinner) {
      setRefreshing(true);
    }

    try {
      setError("");
      const response = await api.get<ListNodesResponse>("/api/nodes");
      setNodes(response.data.data.nodes);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load cluster nodes."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      setIsAdmin(getStoredUser()?.role === "admin");
      void loadNodes();
    });

    const intervalId = window.setInterval(() => {
      void loadNodes();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  const totals = useMemo(() => {
    return nodes.reduce(
      (summary, node) => ({
        totalNodes: summary.totalNodes + 1,
        onlineNodes: summary.onlineNodes + (node.status === "online" ? 1 : 0),
        activeJobs: summary.activeJobs + node.currentJobs.length,
        totalCpus: summary.totalCpus + node.totalCpus,
        availableCpus: summary.availableCpus + node.availableCpus,
        totalMemoryGb: summary.totalMemoryGb + node.totalMemoryGb,
        availableMemoryGb: summary.availableMemoryGb + node.availableMemoryGb,
        totalGpus: summary.totalGpus + node.totalGpus,
        availableGpus: summary.availableGpus + node.availableGpus,
      }),
      {
        totalNodes: 0,
        onlineNodes: 0,
        activeJobs: 0,
        totalCpus: 0,
        availableCpus: 0,
        totalMemoryGb: 0,
        availableMemoryGb: 0,
        totalGpus: 0,
        availableGpus: 0,
      }
    );
  }, [nodes]);

  function updateForm<Key extends keyof CreateNodeInput>(
    key: Key,
    value: CreateNodeInput[Key]
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  function validateForm() {
    if (form.name.trim().length < 2) {
      return "Node name must be at least 2 characters.";
    }

    if (form.totalCpus < 1 || form.totalCpus > 1024) {
      return "CPU capacity must be between 1 and 1024 cores.";
    }

    if (form.totalMemoryGb < 1 || form.totalMemoryGb > 8192) {
      return "Memory capacity must be between 1 and 8192 GB.";
    }

    if (form.totalGpus < 0 || form.totalGpus > 64) {
      return "GPU capacity must be between 0 and 64.";
    }

    return "";
  }

  async function createNode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setCreating(true);

    try {
      const payload: CreateNodeInput = {
        ...form,
        name: form.name.trim(),
      };

      const response = await api.post<NodeResponse>("/api/nodes", payload);
      setSuccessMessage(`${response.data.data.node.name} created and marked online.`);
      setForm({
        ...initialForm,
        name: nextNodeName(form.name),
      });
      await loadNodes(true);
    } catch (err: unknown) {
      setFormError(getApiErrorMessage(err, "Failed to create node."));
    } finally {
      setCreating(false);
    }
  }

  async function updateNodeStatus(node: ClusterNode, status: NodeStatus) {
    setUpdatingNodeId(node._id);
    setError("");

    try {
      await api.patch<NodeResponse>(`/api/nodes/${node._id}/status`, { status });
      await loadNodes(true);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, `Failed to update ${node.name}.`));
    } finally {
      setUpdatingNodeId(null);
    }
  }

  return (
    <ProtectedLayout>
      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cluster Nodes</h2>
          <p className="mt-2 text-slate-400">
            Monitor compute nodes, capacity, availability, and scheduler placement.
          </p>
        </div>

        <button
          onClick={() => void loadNodes(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition hover:border-cyan-400/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={refreshing ? "animate-spin" : ""} size={18} />
          Refresh
        </button>
      </div>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Nodes" value={totals.totalNodes} icon={Server} />
        <SummaryCard label="Online Nodes" value={totals.onlineNodes} icon={CheckCircle2} />
        <SummaryCard label="Active Jobs" value={totals.activeJobs} icon={Signal} />
        <SummaryCard
          label="Available CPU"
          value={`${totals.availableCpus}/${totals.totalCpus}`}
          icon={Cpu}
        />
      </section>

      {(error || formError) && (
        <div className="mb-6 flex gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <span>{error || formError}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {successMessage}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          <div className="border-b border-slate-800 px-6 py-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Node Inventory</h3>
                <p className="text-sm text-slate-400">
                  {lastUpdated ? `Updated ${formatTime(lastUpdated)}` : "Waiting for first refresh"}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-80 items-center justify-center gap-3 text-slate-300">
              <Loader2 className="animate-spin text-cyan-300" size={22} />
              Loading nodes...
            </div>
          ) : nodes.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
              <div className="rounded-xl bg-cyan-400/10 p-4 text-cyan-300">
                <Server size={28} />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No nodes found</h3>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                Add a compute node to give the scheduler capacity for queued workloads.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 p-4">
              {nodes.map((node) => (
                <article
                  key={node._id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-lg font-semibold text-white">{node.name}</h4>
                        <StatusBadge status={node.status} />
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        Last heartbeat {formatDate(node.lastHeartbeat)}
                      </p>
                    </div>

                    {isAdmin && (
                      <div className="flex flex-wrap gap-2">
                        {nodeStatuses.map((status) => (
                          <button
                            key={status}
                            onClick={() => void updateNodeStatus(node, status)}
                            disabled={updatingNodeId === node._id || node.status === status}
                            className={`rounded-xl px-3 py-2 text-xs font-semibold capitalize transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              node.status === status
                                ? "bg-cyan-400 text-slate-950"
                                : "border border-slate-700 text-slate-300 hover:border-cyan-400/70 hover:text-white"
                            }`}
                          >
                            {updatingNodeId === node._id ? "Updating..." : status}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-3">
                    <ResourceMeter
                      label="CPU"
                      icon={Cpu}
                      available={node.availableCpus}
                      total={node.totalCpus}
                      suffix="cores"
                    />
                    <ResourceMeter
                      label="Memory"
                      icon={MemoryStick}
                      available={node.availableMemoryGb}
                      total={node.totalMemoryGb}
                      suffix="GB"
                    />
                    <ResourceMeter
                      label="GPU"
                      icon={HardDrive}
                      available={node.availableGpus}
                      total={node.totalGpus}
                      suffix="GPUs"
                    />
                  </div>

                  <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-slate-300">Current Jobs</p>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                        {node.currentJobs.length}
                      </span>
                    </div>

                    {node.currentJobs.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {node.currentJobs.map((job) => (
                          <span
                            key={job._id}
                            className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200"
                          >
                            {job.jobName} · {job.status}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">No workloads assigned.</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
                <GaugeIcon />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Cluster Capacity</h3>
                <p className="text-sm text-slate-400">Aggregate available resources.</p>
              </div>
            </div>

            <div className="space-y-5">
              <ResourceMeter
                label="CPU"
                icon={Cpu}
                available={totals.availableCpus}
                total={totals.totalCpus}
                suffix="cores"
              />
              <ResourceMeter
                label="Memory"
                icon={MemoryStick}
                available={totals.availableMemoryGb}
                total={totals.totalMemoryGb}
                suffix="GB"
              />
              <ResourceMeter
                label="GPU"
                icon={HardDrive}
                available={totals.availableGpus}
                total={totals.totalGpus}
                suffix="GPUs"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
                <Shield size={22} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Create Node</h3>
                <p className="text-sm text-slate-400">Admin cluster capacity control.</p>
              </div>
            </div>

            {isAdmin ? (
              <form onSubmit={createNode} className="space-y-4">
                <TextField
                  label="Node Name"
                  value={form.name}
                  onChange={(value) => updateForm("name", value)}
                />
                <NumberField
                  label="CPU Cores"
                  value={form.totalCpus}
                  min={1}
                  max={1024}
                  onChange={(value) => updateForm("totalCpus", value)}
                />
                <NumberField
                  label="Memory GB"
                  value={form.totalMemoryGb}
                  min={1}
                  max={8192}
                  onChange={(value) => updateForm("totalMemoryGb", value)}
                />
                <NumberField
                  label="GPUs"
                  value={form.totalGpus}
                  min={0}
                  max={64}
                  onChange={(value) => updateForm("totalGpus", value)}
                />

                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  {creating ? "Creating..." : "Create Node"}
                </button>
              </form>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
                Node creation and status changes require an admin account.
              </div>
            )}
          </section>
        </aside>
      </div>
    </ProtectedLayout>
  );
}

type SummaryCardProps = {
  label: string;
  value: string | number;
  icon: typeof Server;
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

function StatusBadge({ status }: { status: NodeStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

type ResourceMeterProps = {
  label: string;
  icon: typeof Cpu;
  available: number;
  total: number;
  suffix: string;
};

function ResourceMeter({
  label,
  icon: Icon,
  available,
  total,
  suffix,
}: ResourceMeterProps) {
  const used = Math.max(total - available, 0);
  const percentage = total > 0 ? Math.round((used / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-medium text-slate-300">
          <Icon size={16} />
          {label}
        </span>
        <span className="text-right text-slate-400">
          {available}/{total} available {suffix}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-cyan-400"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-slate-500">{percentage}% allocated</p>
    </div>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function TextField({ label, value, onChange }: TextFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <input
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </label>
  );
}

type NumberFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

function NumberField({ label, value, min, max, onChange }: NumberFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <input
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
        type="number"
        value={value}
        min={min}
        max={max}
        step={1}
        onChange={(event) => onChange(Number(event.target.value))}
        required
      />
      <span className="mt-1 block text-xs text-slate-500">
        Range: {min}-{max}
      </span>
    </label>
  );
}

function GaugeIcon() {
  return <Signal size={22} />;
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

function nextNodeName(name: string) {
  const match = name.match(/^(.*?)(\d+)$/);

  if (!match) {
    return `${name}-02`;
  }

  const [, prefix, numericPart] = match;
  const nextNumber = String(Number(numericPart) + 1).padStart(numericPart.length, "0");

  return `${prefix}${nextNumber}`;
}
