import type { Metadata } from "next";
import Link from "next/link";
import RoomScene from "@/components/RoomScene";

export const metadata: Metadata = {
  title: "Tool Use · AI Agent Game",
};

export default function ToolUsePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 bg-[#0A0A0A] px-4 py-8 text-[#F7F7F7]">
      <nav className="flex items-center justify-between">
        <Link
          href="/chat"
          className="text-sm font-semibold text-[#1ABCBD] hover:underline"
        >
          Previous mode: Chat Window
        </Link>
        <Link
          href="/agent"
          className="text-sm font-semibold text-[#1ABCBD] hover:underline"
        >
          Next mode: Single Agent
        </Link>
      </nav>

      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-[#1ABCBD]">
          Game mode 3
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Tool Use</h1>
        <p className="mt-2 max-w-3xl text-zinc-300">
          The chat window can use external tools, but this mode still executes
          one tool action per Submit. The room is the work area, and each
          destination is a tool the chat can call.
        </p>
      </header>

      <RoomScene fixedMode="manual" presentation="tool-use" />
    </main>
  );
}
