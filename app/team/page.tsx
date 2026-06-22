import type { Metadata } from "next";
import Link from "next/link";
import SmallTeamScene from "@/components/SmallTeamScene";

export const metadata: Metadata = {
  title: "Small Team · AI Agent Game",
};

export default function TeamPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 bg-[#0A0A0A] px-4 py-8 text-[#F7F7F7]">
      <nav className="flex items-center justify-between">
        <Link
          href="/agent"
          className="text-sm font-semibold text-[#1ABCBD] hover:underline"
        >
          Previous mode: Single Agent
        </Link>
        <Link
          href="/swarm"
          className="text-sm font-semibold text-[#1ABCBD] hover:underline"
        >
          Next mode: Swarm House
        </Link>
      </nav>

      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-[#1ABCBD]">
          Game mode 5
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Small Team</h1>
        <p className="mt-2 max-w-3xl text-zinc-300">
          One Manager splits the work while two agents carry mess from the
          large left room into a right-side work room.
        </p>
      </header>

      <SmallTeamScene />
    </main>
  );
}
