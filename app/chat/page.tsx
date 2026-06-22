import type { Metadata } from "next";
import Link from "next/link";
import ChatWindowScene from "@/components/ChatWindowScene";

export const metadata: Metadata = {
  title: "Chat Window · AI Agent Game",
};

export default function ChatPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 bg-[#0A0A0A] px-4 py-8 text-[#F7F7F7]">
      <nav className="flex items-center justify-between">
        <Link
          href="/manual"
          className="text-sm font-semibold text-[#1ABCBD] hover:underline"
        >
          Scene 1: Manual Task
        </Link>
        <Link
          href="/agent"
          className="text-sm font-semibold text-[#1ABCBD] hover:underline"
        >
          Scene 3: Single Agent
        </Link>
      </nav>

      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-[#1ABCBD]">
          Scene 2
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Chat Window</h1>
        <p className="mt-2 max-w-3xl text-zinc-300">
          A prompt can produce a useful answer, but it does not operate the
          room. The state stays unchanged until something actually takes
          actions.
        </p>
      </header>

      <ChatWindowScene />
    </main>
  );
}
