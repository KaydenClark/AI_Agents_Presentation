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
          Three short pages that move from a plain chat window, to an
          interactive room-cleaning game, to an AI warehouse factory. No jargon.
          Pick a page to begin.
        </p>
      </header>

      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-3">
        <Link
          href="/chat"
          className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg"
        >
          <span className="mb-4 text-5xl">💬</span>
          <h2 className="text-2xl font-semibold text-slate-900">Chat Window</h2>
          <p className="mt-2 flex-1 text-slate-600">
            Slide 1. Start with a familiar AI chat: helpful words, but no
            hands-on loop that acts in the room by itself.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 font-semibold text-indigo-600 group-hover:gap-3">
            Open Slide 1<span aria-hidden>→</span>
          </span>
        </Link>

        <Link
          href="/room"
          className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg"
        >
          <span className="mb-4 text-5xl">▣</span>
          <h2 className="text-2xl font-semibold text-slate-900">
            Interactive Room
          </h2>
          <p className="mt-2 flex-1 text-slate-600">
            Page 2. Drag clutter to the right furniture, then prompt a hand one
            step at a time, then let a single room agent clean the whole room
            from one goal.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 font-semibold text-indigo-600 group-hover:gap-3">
            Open Room Game
            <span aria-hidden>→</span>
          </span>
        </Link>

        <Link
          href="/warehouse"
          className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg"
        >
          <span className="mb-4 text-5xl">🏭</span>
          <h2 className="text-2xl font-semibold text-slate-900">
            AI Warehouse Factory
          </h2>
          <p className="mt-2 flex-1 text-slate-600">
            Page 3. One Boss breaks a big job into zones, Managers assign
            Agents, and the work reports back up the chain &mdash; a whole
            factory of agents working together.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 font-semibold text-indigo-600 group-hover:gap-3">
            Open Factory
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
