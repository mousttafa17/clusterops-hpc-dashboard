"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  Cpu,
  Gauge,
  HardDrive,
  Loader2,
  MemoryStick,
  RefreshCw,
  Server,
  Users,
  XCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { api, getApiErrorMessage, getApiUrl } from "@/lib/api";
import { MetricsOverview, MetricsOverviewResponse } from "@/types/metrics";

const jobColors = {
  queued: "#fbbf24",
  running: "#22d3ee",
  completed: "#34d399",
  failed: "#f87171",
  cancelled: "#94a3b8",
};

const resourceColors = {
  CPU: "#22d3ee",
  Memory: "#a78bfa",
  GPU: "#34d399",
};

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<MetricsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function loadMetrics(showSpinner = false) {
    if (showSpinner) {
      setRefreshing(true);
    }

    try {
      setError("");
      const response = await api.get<MetricsOverviewResponse>("/api/metrics/overview");
      setMetrics(response.data.data);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load metrics."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadMetrics();
    });

    const intervalId = window.setInterval(() => {
      void loadMetrics();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  const jobs = metrics?.jobs || {};
  const cluster = metrics?.cluster || {};
  const users = metrics?.users || {};

  const jobStatusData = useMemo(
    () => [
      { name: "Queued", key: "queued", value: jobs.queued ?? 0 },
      { name: "Running", key: "running", value: jobs.running ?? 0 },
      { name: "Completed", key: "completed", value: jobs.completed ?? 0 },
      { name: "Failed", key: "failed", value: jobs.failed ?? 0 },
      { name: "Cancelled", key: "cancelled", value: jobs.cancelled ?? 0 },
    ],
    [jobs.cancelled, jobs.completed, jobs.failed, jobs.queued, jobs.running]
  );

  const resourceData = useMemo(
    () => [
      buildResourceMetric("CPU", cluster.totalCpus ?? 0, cluster.availableCpus ?? 0),
      buildResourceMetric(
        "Memory",
        cluster.totalMemoryGb ?? 0,
        cluster.availableMemoryGb ?? 0
      ),
      buildResourceMetric("GPU", cluster.totalGpus ?? 0, cluster.availableGpus ?? 0),
    ],
    [
      cluster.availableCpus,
      cluster.availableGpus,
      cluster.availableMemoryGb,
      cluster.totalCpus,
      cluster.totalGpus,
      cluster.totalMemoryGb,
    ]
  );

  const nodeData = useMemo(() => {
    const totalNodes = cluster.totalNodes ?? 0;
    const onlineNodes = cluster.onlineNodes ?? 0;
    return [
      { name: "Online", value: onlineNodes, color: "#34d399" },
      { name: "Offline", value: Math.max(totalNodes - onlineNodes, 0), color: "#f87171" },
    ];
  }, [cluster.onlineNodes, cluster.totalNodes]);

  const totalUsedResources = resourceData.reduce(
    (total, resource) => total + resource.used,
    0
  );
  const queuePressure =
    (jobs.total ?? 0) > 0
      ? Math.round((((jobs.queued ?? 0) + (jobs.running ?? 0)) / (jobs.total ?? 1)) * 100)
      : 0;

  return (
    <ProtectedLayout>
      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Metrics</h2>
          <p className="mt-2 text-slate-400">
            Visualize scheduler activity, cluster utilization, and Prometheus-style counters.
          </p>
        </div>

        <button
          onClick={() => void loadMetrics(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition hover:border-cyan-400/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={refreshing ? "animate-spin" : ""} size={18} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 flex gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-96 items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 text-slate-300">
          <Loader2 className="animate-spin text-cyan-300" size={22} />
          Loading metrics...
        </div>
      ) : (
        <>
          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total Jobs"
              value={jobs.total ?? 0}
              detail={`${jobs.running ?? 0} running now`}
              icon={Activity}
            />
            <MetricCard
              label="Online Nodes"
              value={`${cluster.onlineNodes ?? 0}/${cluster.totalNodes ?? 0}`}
              detail="cluster availability"
              icon={Server}
            />
            <MetricCard
              label="Queue Pressure"
              value={`${queuePressure}%`}
              detail="queued plus running jobs"
              icon={Gauge}
            />
            <MetricCard
              label="Users"
              value={users.total ?? 0}
              detail="registered accounts"
              icon={Users}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <ChartPanel
              title="Jobs By Status"
              subtitle="Current lifecycle distribution"
              icon={BarChart3}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={jobStatusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={104}
                      paddingAngle={3}
                    >
                      {jobStatusData.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={jobColors[entry.key as keyof typeof jobColors]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#020617",
                        border: "1px solid #1e293b",
                        borderRadius: 12,
                        color: "#f8fafc",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {jobStatusData.map((item) => (
                  <LegendRow
                    key={item.key}
                    color={jobColors[item.key as keyof typeof jobColors]}
                    label={item.name}
                    value={item.value}
                  />
                ))}
              </div>
            </ChartPanel>

            <ChartPanel
              title="Resource Utilization"
              subtitle="Used capacity across CPU, memory, and GPU"
              icon={Cpu}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resourceData} margin={{ left: -20, right: 12 }}>
                    <CartesianGrid stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      formatter={(value, _name, props) => [
                        `${value}% (${props.payload.used}/${props.payload.total})`,
                        "Used",
                      ]}
                      contentStyle={{
                        background: "#020617",
                        border: "1px solid #1e293b",
                        borderRadius: 12,
                        color: "#f8fafc",
                      }}
                    />
                    <Bar dataKey="percentage" radius={[8, 8, 0, 0]}>
                      {resourceData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={resourceColors[entry.name as keyof typeof resourceColors]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                {resourceData.map((resource) => (
                  <ResourceMeter key={resource.name} resource={resource} />
                ))}
              </div>
            </ChartPanel>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <ChartPanel
              title="Node Availability"
              subtitle="Online versus unavailable compute nodes"
              icon={Server}
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={nodeData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={96}
                    >
                      {nodeData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#020617",
                        border: "1px solid #1e293b",
                        borderRadius: 12,
                        color: "#f8fafc",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {nodeData.map((item) => (
                  <LegendRow
                    key={item.name}
                    color={item.color}
                    label={item.name}
                    value={item.value}
                  />
                ))}
              </div>
            </ChartPanel>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Operational Snapshot</h3>
                  <p className="text-sm text-slate-400">
                    Last refresh: {lastUpdated ? formatTime(lastUpdated) : "not available"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SnapshotRow icon={Clock} label="Queued Jobs" value={jobs.queued ?? 0} />
                <SnapshotRow icon={Cpu} label="Running Jobs" value={jobs.running ?? 0} />
                <SnapshotRow icon={CheckCircle2} label="Completed Jobs" value={jobs.completed ?? 0} />
                <SnapshotRow icon={XCircle} label="Failed Jobs" value={jobs.failed ?? 0} />
                <SnapshotRow icon={MemoryStick} label="Available Memory" value={`${cluster.availableMemoryGb ?? 0} GB`} />
                <SnapshotRow icon={HardDrive} label="Available GPUs" value={cluster.availableGpus ?? 0} />
              </div>

              <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm font-medium text-slate-300">Prometheus Endpoint</p>
                <p className="mt-2 break-all font-mono text-sm text-cyan-200">
                  {getApiUrl()}/prometheus
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  Exposes text-format counters for jobs, nodes, CPU, memory, and GPU capacity.
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm font-medium text-slate-300">Total Used Resource Units</p>
                <p className="mt-2 text-3xl font-bold">{totalUsedResources}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Combined used CPU cores, memory GB, and GPU units.
                </p>
              </div>
            </section>
          </section>
        </>
      )}
    </ProtectedLayout>
  );
}

type MetricCardProps = {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Activity;
};

function MetricCard({ label, value, detail, icon: Icon }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

type ChartPanelProps = {
  title: string;
  subtitle: string;
  icon: typeof Activity;
  children: React.ReactNode;
};

function ChartPanel({ title, subtitle, icon: Icon, children }: ChartPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
          <Icon size={22} />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

type LegendRowProps = {
  color: string;
  label: string;
  value: number;
};

function LegendRow({ color, label, value }: LegendRowProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
      <span className="flex items-center gap-2 text-sm text-slate-300">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

type ResourceMetric = {
  name: "CPU" | "Memory" | "GPU";
  total: number;
  available: number;
  used: number;
  percentage: number;
};

function ResourceMeter({ resource }: { resource: ResourceMetric }) {
  const color = resourceColors[resource.name];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-300">{resource.name}</span>
        <span className="text-slate-400">
          {resource.used}/{resource.total} used
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full"
          style={{ width: `${resource.percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

type SnapshotRowProps = {
  icon: typeof Activity;
  label: string;
  value: string | number;
};

function SnapshotRow({ icon: Icon, label, value }: SnapshotRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
      <Icon className="text-cyan-300" size={18} />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-semibold text-slate-100">{value}</p>
      </div>
    </div>
  );
}

function buildResourceMetric(
  name: ResourceMetric["name"],
  total: number,
  available: number
): ResourceMetric {
  const used = Math.max(total - available, 0);
  const percentage = total > 0 ? Math.round((used / total) * 100) : 0;

  return {
    name,
    total,
    available,
    used,
    percentage,
  };
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(value);
}
