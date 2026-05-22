"use client";

import { useEffect, useState } from "react";
import { Activity, AlertCircle, CheckCircle2, Clock, Cpu, Server } from "lucide-react";
import { api } from "@/lib/api";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { MetricsOverview } from "@/types/metrics";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricsOverview | null>(null);
  const [health, setHealth] = useState<string>("Checking...");
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setError("");

      const [healthResponse, metricsResponse] = await Promise.all([
        api.get("/health"),
        api.get("/api/metrics/overview"),
      ]);

      setHealth(healthResponse.data?.status || "ok");

      const metricsData =
        metricsResponse.data?.data || metricsResponse.data?.metrics || metricsResponse.data;

      setMetrics(metricsData);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load dashboard data."
      );
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const jobs = metrics?.jobs || {};
  const cluster = metrics?.cluster || {};

  const cards = [
    {
      label: "Backend Health",
      value: health,
      icon: CheckCircle2,
    },
    {
      label: "Total Jobs",
      value: jobs.total ?? 0,
      icon: Activity,
    },
    {
      label: "Queued Jobs",
      value: jobs.queued ?? 0,
      icon: Clock,
    },
    {
      label: "Running Jobs",
      value: jobs.running ?? 0,
      icon: Cpu,
    },
    {
      label: "Failed Jobs",
      value: jobs.failed ?? 0,
      icon: AlertCircle,
    },
    {
      label: "Online Nodes",
      value: cluster.onlineNodes ?? 0,
      icon: Server,
    },
  ];

  return (
    <ProtectedLayout>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="mt-2 text-slate-400">
            Overview of cluster jobs, node availability, and backend status.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200">
          {error}
        </div>
      )}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{card.label}</p>
                  <p className="mt-3 text-3xl font-bold">{card.value}</p>
                </div>

                <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold">Cluster Resources</h3>

          <div className="mt-5 space-y-4 text-sm">
            <ResourceRow
              label="CPU"
              available={cluster.availableCpus ?? 0}
              total={cluster.totalCpus ?? 0}
              suffix="cores"
            />
            <ResourceRow
              label="Memory"
              available={cluster.availableMemoryGb ?? 0}
              total={cluster.totalMemoryGb ?? 0}
              suffix="GB"
            />
            <ResourceRow
              label="GPU"
              available={cluster.availableGpus ?? 0}
              total={cluster.totalGpus ?? 0}
              suffix="GPUs"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold">Phase 3 Status</h3>

          <ul className="mt-5 space-y-3 text-sm text-slate-300">
            <li>✅ Next.js frontend created</li>
            <li>✅ Login/register pages connected to backend</li>
            <li>✅ JWT stored in browser localStorage</li>
            <li>✅ Protected dashboard shell created</li>
            <li>✅ Metrics loaded from backend API</li>
          </ul>
        </div>
      </section>
    </ProtectedLayout>
  );
}

type ResourceRowProps = {
  label: string;
  available: number;
  total: number;
  suffix: string;
};

function ResourceRow({ label, available, total, suffix }: ResourceRowProps) {
  const used = Math.max(total - available, 0);
  const percentage = total > 0 ? Math.round((used / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">
          {available}/{total} available {suffix}
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-cyan-400"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}