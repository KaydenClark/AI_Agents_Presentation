import type { Metadata } from "next";
import Link from "next/link";
import WarehouseScene from "@/components/WarehouseScene";

export const metadata: Metadata = {
  title: "Swarm Warehouse · AI Agent Swarm Demo",
};

export default function WarehousePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8">
      <nav className="flex items-center justify-between">
        <Link
          href="/room"
          className="text-sm font-semibold text-indigo-600 hover:underline"
        >
          ← Scene 1: Single Room
        </Link>
        <Link
          href="/"
          className="text-sm font-semibold text-indigo-600 hover:underline"
        >
          Home →
        </Link>
      </nav>

      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
          Scene 2
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Swarm Warehouse</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          One big job, a whole team. The <strong>Boss</strong> reads your
          instruction and uses real AI to break it into a different plan for
          each zone. Each <strong>Manager</strong> assigns two{" "}
          <strong>Agents</strong>, reviews their work, and reports back up the
          chain. If something gets truly stuck, it surfaces to a human &mdash;
          the real exit point.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-indigo-100 px-3 py-1 font-semibold text-indigo-700">
            🧑‍💼 1 Boss
          </span>
          <span aria-hidden className="text-slate-400">
            →
          </span>
          <span className="rounded-full bg-sky-100 px-3 py-1 font-semibold text-sky-700">
            🧑‍🔧 3 Managers
          </span>
          <span aria-hidden className="text-slate-400">
            →
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
            🤖 6 Agents
          </span>
        </div>
      </header>

      <WarehouseScene />
    </main>
  );
}
