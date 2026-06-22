import type { Metadata } from "next";
import Link from "next/link";
import RoomScene from "@/components/RoomScene";

export const metadata: Metadata = {
  title: "Single Agent · AI Agent Game",
};

export default function AgentPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 bg-[#0A0A0A] px-4 py-8 text-[#F7F7F7]">
      <nav className="flex items-center justify-between">
        <Link
          href="/chat"
          className="text-sm font-semibold text-[#1ABCBD] hover:underline"
        >
          Scene 2: Chat Window
        </Link>
        <Link
          href="/team"
          className="text-sm font-semibold text-[#1ABCBD] hover:underline"
        >
          Scene 4: Small Team
        </Link>
      </nav>

      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-[#1ABCBD]">
          Scene 3
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Single Agent</h1>
        <p className="mt-2 max-w-2xl text-zinc-300">
          You give one goal. The agent chooses each next action, uses the room,
          returns home between chores, and stops only when the whole room is
          clean.
        </p>
      </header>

      <RoomScene fixedMode="agent" />
    </main>
  );
}
