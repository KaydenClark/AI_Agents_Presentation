import type { Metadata } from "next";
import Link from "next/link";
import RoomScene from "@/components/RoomScene";

export const metadata: Metadata = {
  title: "Single Room · AI Agent Swarm Demo",
};

export default function RoomPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-8">
      <nav className="flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold text-indigo-600 hover:underline"
        >
          ← Home
        </Link>
        <Link
          href="/warehouse"
          className="text-sm font-semibold text-indigo-600 hover:underline"
        >
          Scene 2: Swarm Warehouse →
        </Link>
      </nav>

      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
          Scene 1
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Single Room</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          A little worker tidies a messy room, carrying each item to where it
          belongs. Toggle between <strong>Manual</strong> (you trigger every
          single step) and <strong>Agent</strong> (you give one goal and it
          cleans the whole room by itself). That self-finishing loop is what
          makes something an &ldquo;agent.&rdquo;
        </p>
      </header>

      <RoomScene />
    </main>
  );
}
