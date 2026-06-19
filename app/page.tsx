import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 px-6 py-16">
      <header className="max-w-2xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">
          Internal Training
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          What is an AI Agent?
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Two short scenes that explain &ldquo;AI agent&rdquo; and &ldquo;agent
          swarm&rdquo; with a simple idea: cleaning a messy room. No jargon.
          Pick a scene to begin.
        </p>
      </header>

      <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-2">
        <Link
          href="/room"
          className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg"
        >
          <span className="mb-4 text-5xl">🧹</span>
          <h2 className="text-2xl font-semibold text-slate-900">Single Room</h2>
          <p className="mt-2 flex-1 text-slate-600">
            Scene 1. See the difference between doing every step yourself
            (Manual) and giving one goal to an agent that finishes the whole job
            on its own.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 font-semibold text-indigo-600 group-hover:gap-3">
            Open Scene 1
            <span aria-hidden>→</span>
          </span>
        </Link>

        <Link
          href="/warehouse"
          className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg"
        >
          <span className="mb-4 text-5xl">🏭</span>
          <h2 className="text-2xl font-semibold text-slate-900">
            Swarm Warehouse
          </h2>
          <p className="mt-2 flex-1 text-slate-600">
            Scene 2. One Boss breaks a big job into zones, Managers assign
            Agents, and the work reports back up the chain &mdash; a whole team
            of agents working together.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 font-semibold text-indigo-600 group-hover:gap-3">
            Open Scene 2
            <span aria-hidden>→</span>
          </span>
        </Link>
      </div>

      <footer className="text-center text-sm text-slate-400">
        Each browser tab is its own private session. Open this on your own
        laptop and follow along.
      </footer>
    </main>
  );
}
