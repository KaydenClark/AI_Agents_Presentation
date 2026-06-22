import type { Metadata } from "next";
import Link from "next/link";
import ManualDragGame from "@/components/ManualDragGame";

export const metadata: Metadata = {
  title: "Manual Game · AI Agent Game",
};

export default function ManualPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 bg-[#0A0A0A] px-4 py-8 text-[#F7F7F7]">
      <nav className="flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold text-[#1ABCBD] hover:underline"
        >
          Home
        </Link>
        <Link
          href="/chat"
          className="text-sm font-semibold text-[#1ABCBD] hover:underline"
        >
          Next mode: Chat Window
        </Link>
      </nav>

      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-[#1ABCBD]">
          Game mode 1
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Manual Game</h1>
        <p className="mt-2 max-w-2xl text-zinc-300">
          You are the agent. Drag the trash to the trash can, the cup to the
          sink, and the book to the bookshelf.
        </p>
      </header>

      <ManualDragGame />
    </main>
  );
}
