import { ProtectedLayout } from "@/components/layout/ProtectedLayout";

export default function SubmitJobPage() {
  return (
    <ProtectedLayout>
      <h2 className="text-3xl font-bold">Submit Job</h2>
      <p className="mt-2 text-slate-400">
        Job submission form will be implemented in the next frontend step.
      </p>
    </ProtectedLayout>
  );
}