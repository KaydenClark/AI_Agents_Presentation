import Link from "next/link";
import { RoomIcon, SwarmIcon } from "@/components/UiIcons";

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
          Two short scenes that explain &ldquo;AI agent&rdquo; and &ldquo;agent
          swarm&rdquo; with visible rooms, workers, and report paths. No
          jargon. Pick a scene to begin.
        </p>
      </header>

      <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-2">
        <Link
          href="/room"
          className="group flex flex-col rounded-lg border border-[#474747] bg-[#191919] p-8 shadow-sm transition hover:-translate-y-1 hover:border-[#3A7CA5] hover:shadow-lg"
        >
          <RoomIcon className="mb-4 h-12 w-12 text-[#3A7CA5]" />
          <h2 className="text-2xl font-semibold text-[#F7F7F7]">Single Room</h2>
          <p className="mt-2 flex-1 text-zinc-300">
            Scene 1. See the difference between doing every step yourself
            (Manual) and giving one goal to an agent that tidies the whole room
            on its own.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 font-semibold text-[#1ABCBD] group-hover:gap-3">
            Open Scene 1
            <span aria-hidden>→</span>
          </span>
        </Link>

        <Link
          href="/warehouse"
          className="group flex flex-col rounded-lg border border-[#474747] bg-[#191919] p-8 shadow-sm transition hover:-translate-y-1 hover:border-[#3A7CA5] hover:shadow-lg"
        >
          <SwarmIcon className="mb-4 h-12 w-12 text-[#E0BD3E]" />
          <h2 className="text-2xl font-semibold text-[#F7F7F7]">
            Swarm Warehouse
          </h2>
          <p className="mt-2 flex-1 text-zinc-300">
            Scene 2. One Boss breaks a big job into zones, Managers assign
            Agents, and the work reports back up the chain &mdash; a whole team
            of agents working together.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 font-semibold text-[#1ABCBD] group-hover:gap-3">
            Open Scene 2
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
