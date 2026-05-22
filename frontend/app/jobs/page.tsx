import { ProtectedLayout } from "@/components/layout/ProtectedLayout";

export default function JobsPage() {
  return (
    <ProtectedLayout>
      <h2 className="text-3xl font-bold">Jobs</h2>
      <p className="mt-2 text-slate-400">
        Jobs table will be implemented in the next frontend step.
      </p>
    </ProtectedLayout>
  );
}