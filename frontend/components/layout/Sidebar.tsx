"use client";

import Link from "next/link";
import { Activity, Cpu, Gauge, LayoutDashboard, LogOut, Server, UploadCloud } from "lucide-react";
import { logout } from "@/lib/auth";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Submit Job",
    href: "/submit-job",
    icon: UploadCloud,
  },
  {
    label: "Jobs",
    href: "/jobs",
    icon: Activity,
  },
  {
    label: "Cluster Nodes",
    href: "/nodes",
    icon: Server,
  },
  {
    label: "Metrics",
    href: "/metrics",
    icon: Gauge,
  },
];

export function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-72 border-r border-slate-800 bg-slate-950 p-6 text-white lg:block">
      <Link href="/dashboard" className="block">
        <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-400 p-2 text-slate-950">
              <Cpu size={22} />
            </div>
            <div>
              <p className="font-bold">ClusterOps</p>
              <p className="text-xs text-cyan-200">HPC Dashboard</p>
            </div>
          </div>
        </div>
      </Link>

      <nav className="mt-8 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={logout}
        className="mt-8 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
      >
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  );
}