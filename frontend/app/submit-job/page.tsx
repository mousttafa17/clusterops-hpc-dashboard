"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Cpu,
  FileCode2,
  HardDrive,
  Loader2,
  MemoryStick,
  Play,
  RotateCcw,
  Timer,
} from "lucide-react";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { api, getApiErrorMessage } from "@/lib/api";
import { SubmitJobInput, SubmitJobResponse } from "@/types/job";

const defaultScript = `#!/bin/bash
echo "Starting ClusterOps simulation"
python heat_simulation.py --steps 1000
echo "Simulation complete"`;

const initialForm: SubmitJobInput = {
  jobName: "heat-simulation-test",
  script: defaultScript,
  cpus: 2,
  memoryGb: 4,
  gpus: 0,
  estimatedRuntimeSeconds: 10,
};

export default function SubmitJobPage() {
  const router = useRouter();
  const [form, setForm] = useState<SubmitJobInput>(initialForm);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField<Key extends keyof SubmitJobInput>(
    key: Key,
    value: SubmitJobInput[Key]
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  function validateForm() {
    if (form.jobName.trim().length < 2) {
      return "Job name must be at least 2 characters.";
    }

    if (!form.script.trim()) {
      return "Job script is required.";
    }

    if (form.cpus < 1 || form.cpus > 256) {
      return "CPU request must be between 1 and 256 cores.";
    }

    if (form.memoryGb < 1 || form.memoryGb > 2048) {
      return "Memory request must be between 1 and 2048 GB.";
    }

    if (form.gpus < 0 || form.gpus > 16) {
      return "GPU request must be between 0 and 16.";
    }

    if (form.estimatedRuntimeSeconds < 5 || form.estimatedRuntimeSeconds > 86400) {
      return "Estimated runtime must be between 5 seconds and 24 hours.";
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const payload: SubmitJobInput = {
        ...form,
        jobName: form.jobName.trim(),
        script: form.script.trim(),
      };

      const response = await api.post<SubmitJobResponse>("/api/jobs", payload);
      const job = response.data.data.job;

      setSuccessMessage(
        `Job ${job.slurmJobId} submitted successfully and added to the queue.`
      );

      window.setTimeout(() => {
        router.push("/jobs");
      }, 900);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to submit job."));
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(initialForm);
    setError("");
    setSuccessMessage("");
  }

  return (
    <ProtectedLayout>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Submit Job</h2>
          <p className="mt-2 text-slate-400">
            Create a Slurm-style workload request for the simulated cluster queue.
          </p>
        </div>

        <Link
          href="/jobs"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition hover:border-cyan-400/70 hover:text-white"
        >
          <FileCode2 size={18} />
          View Jobs
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
              <FileCode2 size={22} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Job Definition</h3>
              <p className="text-sm text-slate-400">Name the workload and provide the shell script.</p>
            </div>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Job Name
              </span>
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                value={form.jobName}
                onChange={(event) => updateField("jobName", event.target.value)}
                minLength={2}
                maxLength={120}
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Job Script
              </span>
              <textarea
                className="min-h-80 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm leading-6 text-slate-100 outline-none transition focus:border-cyan-400"
                value={form.script}
                onChange={(event) => updateField("script", event.target.value)}
                maxLength={10000}
                spellCheck={false}
                required
              />
            </label>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
                <Cpu size={22} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Resource Request</h3>
                <p className="text-sm text-slate-400">Match backend scheduler limits.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <NumberField
                label="CPU Cores"
                icon={Cpu}
                value={form.cpus}
                min={1}
                max={256}
                suffix="cores"
                onChange={(value) => updateField("cpus", value)}
              />
              <NumberField
                label="Memory"
                icon={MemoryStick}
                value={form.memoryGb}
                min={1}
                max={2048}
                suffix="GB"
                onChange={(value) => updateField("memoryGb", value)}
              />
              <NumberField
                label="GPUs"
                icon={HardDrive}
                value={form.gpus}
                min={0}
                max={16}
                suffix="GPUs"
                onChange={(value) => updateField("gpus", value)}
              />
              <NumberField
                label="Runtime"
                icon={Timer}
                value={form.estimatedRuntimeSeconds}
                min={5}
                max={86400}
                suffix="seconds"
                onChange={(value) => updateField("estimatedRuntimeSeconds", value)}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Submission Preview</h3>
            <div className="mt-5 space-y-3 text-sm">
              <PreviewRow label="Queue State" value="queued on submit" />
              <PreviewRow label="CPU" value={`${form.cpus} core${form.cpus === 1 ? "" : "s"}`} />
              <PreviewRow label="Memory" value={`${form.memoryGb} GB`} />
              <PreviewRow label="GPU" value={`${form.gpus}`} />
              <PreviewRow label="Runtime" value={`${form.estimatedRuntimeSeconds}s`} />
            </div>

            {error && (
              <div className="mt-5 flex gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <AlertCircle className="mt-0.5 shrink-0" size={18} />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="mt-5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {successMessage}
              </div>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                {loading ? "Submitting..." : "Submit Job"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition hover:border-cyan-400/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>
          </section>
        </aside>
      </form>
    </ProtectedLayout>
  );
}

type NumberFieldProps = {
  label: string;
  icon: typeof Cpu;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
};

function NumberField({
  label,
  icon: Icon,
  value,
  min,
  max,
  suffix,
  onChange,
}: NumberFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
        <Icon size={16} />
        {label}
      </span>
      <div className="flex overflow-hidden rounded-xl border border-slate-700 bg-slate-950 transition focus-within:border-cyan-400">
        <input
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-white outline-none"
          type="number"
          value={value}
          min={min}
          max={max}
          step={1}
          onChange={(event) => onChange(Number(event.target.value))}
          required
        />
        <span className="flex min-w-24 items-center justify-center border-l border-slate-800 px-3 text-sm text-slate-400">
          {suffix}
        </span>
      </div>
      <span className="mt-1 block text-xs text-slate-500">
        Range: {min}-{max}
      </span>
    </label>
  );
}

type PreviewRowProps = {
  label: string;
  value: string;
};

function PreviewRow({ label, value }: PreviewRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3 last:border-b-0 last:pb-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-100">{value}</span>
    </div>
  );
}
