import { ProtectedLayout } from "@/components/layout/ProtectedLayout";

export default function NodesPage() {
  return (
    <ProtectedLayout>
      <h2 className="text-3xl font-bold">Cluster Nodes</h2>
      <p className="mt-2 text-slate-400">
        Cluster nodes table will be implemented in the next frontend step.
      </p>
    </ProtectedLayout>
  );
}