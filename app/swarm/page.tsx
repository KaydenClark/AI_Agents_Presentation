import type { Metadata } from "next";
import Link from "next/link";
import WarehouseScene from "@/components/WarehouseScene";
import { AgentIcon, BossIcon, ManagerIcon } from "@/components/UiIcons";

export const metadata: Metadata = {
  title: "Swarm House · AI Agent Game",
};

export default function SwarmPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 bg-[#0A0A0A] px-4 py-8 text-[#F7F7F7]">
      <nav className="flex items-center justify-between">
        <Link
          href="/team"
          className="text-sm font-semibold text-[#1ABCBD] hover:underline"
        >
          Scene 4: Small Team
        </Link>
        <Link
          href="/"
          className="text-sm font-semibold text-[#1ABCBD] hover:underline"
        >
          Home
        </Link>
      </nav>

      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-[#1ABCBD]">
          Scene 5
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Swarm House</h1>
        <p className="mt-2 max-w-3xl text-zinc-300">
          One instruction, a changing mess, a whole hierarchy, and the AI runs
          all of it. The <strong>Boss</strong> uses real AI or deterministic
          fallback to split work across Managers. Each Manager drives two
          Agents, and while they work you can drop new items into the Living
          room so the swarm adapts live.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3A7CA5]/40 bg-[#3A7CA5]/15 px-3 py-1 font-semibold text-[#8cc7e6]">
            <BossIcon className="h-4 w-4" />
            1 Boss
          </span>
          <span aria-hidden className="text-zinc-500">
            →
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E0BD3E]/40 bg-[#E0BD3E]/15 px-3 py-1 font-semibold text-[#f1d977]">
            <ManagerIcon className="h-4 w-4" />
            3 Managers
          </span>
          <span aria-hidden className="text-zinc-500">
            →
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#4DAA57]/40 bg-[#4DAA57]/15 px-3 py-1 font-semibold text-[#95df9d]">
            <AgentIcon className="h-4 w-4" />
            6 Agents
          </span>
        </div>
      </header>

      <WarehouseScene />
    </main>
  );
}
