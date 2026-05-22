import { ProtectedLayout } from "@/components/layout/ProtectedLayout";

export default function MetricsPage() {
  return (
    <ProtectedLayout>
      <h2 className="text-3xl font-bold">Metrics</h2>
      <p className="mt-2 text-slate-400">
        Metrics charts will be implemented after the core pages work.
      </p>
    </ProtectedLayout>
  );
}