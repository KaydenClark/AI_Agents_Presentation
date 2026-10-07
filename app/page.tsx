import Link from "next/link";
import { RoomIcon, SwarmIcon, ThoughtIcon } from "@/components/UiIcons";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 bg-[#0A0A0A] px-6 py-16 text-[#F7F7F7]">
      <header className="max-w-2xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#1ABCBD]">
          Internal Training
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-[#F7F7F7] sm:text-5xl">
          What is an AI Agent?
        </h1>
        <p className="mt-4 text-lg text-zinc-300">
          Three short pages that move from a plain chat window, to an
          interactive room-cleaning game, to an AI warehouse factory. No jargon.
          Pick a page to begin.
        </p>
      </header>

      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-3">
        <Link
          href="/chat"
          className="group flex flex-col rounded-lg border border-[#474747] bg-[#191919] p-8 shadow-sm transition hover:-translate-y-1 hover:border-[#3A7CA5] hover:shadow-lg"
        >
          <ThoughtIcon className="mb-4 h-12 w-12 text-[#1ABCBD]" />
          <h2 className="text-2xl font-semibold text-[#F7F7F7]">Chat Window</h2>
          <p className="mt-2 flex-1 text-zinc-300">
            Slide 1. Start with a familiar AI chat: helpful words, but no
            hands-on loop that acts in the room by itself.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 font-semibold text-[#1ABCBD] group-hover:gap-3">
            Open Slide 1<span aria-hidden>→</span>
          </span>
        </Link>

        <Link
          href="/room"
          className="group flex flex-col rounded-lg border border-[#474747] bg-[#191919] p-8 shadow-sm transition hover:-translate-y-1 hover:border-[#3A7CA5] hover:shadow-lg"
        >
          <RoomIcon className="mb-4 h-12 w-12 text-[#3A7CA5]" />
          <h2 className="text-2xl font-semibold text-[#F7F7F7]">
            Interactive Room
          </h2>
          <p className="mt-2 flex-1 text-zinc-300">
            Page 2. Drag clutter to the right furniture, then prompt a hand one
            step at a time, then let a single room agent clean the whole room
            from one goal.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 font-semibold text-[#1ABCBD] group-hover:gap-3">
            Open Room Game
            <span aria-hidden>→</span>
          </span>
        </Link>

        <Link
          href="/warehouse"
          className="group flex flex-col rounded-lg border border-[#474747] bg-[#191919] p-8 shadow-sm transition hover:-translate-y-1 hover:border-[#3A7CA5] hover:shadow-lg"
        >
          <SwarmIcon className="mb-4 h-12 w-12 text-[#E0BD3E]" />
          <h2 className="text-2xl font-semibold text-[#F7F7F7]">
            AI Warehouse Factory
          </h2>
          <p className="mt-2 flex-1 text-zinc-300">
            Page 3. One Boss breaks a big job into zones, Managers assign
            Agents, and the work reports back up the chain &mdash; a whole
            factory of agents working together.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 font-semibold text-[#1ABCBD] group-hover:gap-3">
            Open Factory
            <span aria-hidden>→</span>
          </span>
        </Link>
      </div>

      <footer className="text-center text-sm text-zinc-500">
        Each browser tab is its own private session. Open this on your own
        laptop and follow along.
      </footer>
    </main>
  );
}
