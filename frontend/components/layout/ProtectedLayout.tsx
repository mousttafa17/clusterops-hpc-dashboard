"use client";

import { ReactNode, useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { getStoredUser, loadAuthFromStorage } from "@/lib/auth";

type ProtectedLayoutProps = {
  children: ReactNode;
};

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const [ready, setReady] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const token = loadAuthFromStorage();
    const user = getStoredUser();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setUserName(user?.name || "ClusterOps User");
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-4">
          Loading dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex">
        <Sidebar />

        <section className="min-h-screen flex-1">
          <header className="border-b border-slate-800 bg-slate-950/80 px-6 py-5 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Welcome back</p>
                <h1 className="text-xl font-semibold">{userName}</h1>
              </div>

              <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
                Backend: localhost:5001
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
        </section>
      </div>
    </main>
  );
}