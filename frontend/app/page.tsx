import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
          ClusterOps HPC Dashboard
        </div>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Web dashboard for simulated HPC cluster job management.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          Submit jobs, monitor cluster resources, track queue states, and view
          scheduler metrics through a unified full-stack interface.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/login"
            className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-100 transition hover:bg-slate-900"
          >
            Create Account
          </Link>
        </div>
      </section>
    </main>
  );
}