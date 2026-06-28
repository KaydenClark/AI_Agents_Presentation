import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Chat Window · AI Agent Swarm Demo",
};

const messages = [
  { who: "Human", text: "Can you help me clean this room?" },
  {
    who: "AI chat",
    text: "Yes. Tell me each step and I can respond, but I do not act on the room by myself.",
  },
  { who: "Human", text: "Pick up the sock." },
  {
    who: "AI chat",
    text: "I would pick up the sock and look for the laundry hamper.",
  },
];

export default function ChatPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-8">
      <nav className="flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold text-indigo-600 hover:underline"
        >
          ← Home
        </Link>
        <Link
          href="/room"
          className="text-sm font-semibold text-indigo-600 hover:underline"
        >
          Interactive room →
        </Link>
      </nav>
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
          Slide 1
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Chat Window</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Start with plain chat: useful answers, but no persistent loop, no
          visible hands, and no automatic cleanup. The next page turns the same
          room into an interactive game and then an agent.
        </p>
      </header>
      <section
        aria-label="Example chat window"
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="ml-3 text-sm font-semibold text-slate-500">
            AI helper chat
          </span>
        </div>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={`${message.who}-${message.text}`}
              className={`flex ${message.who === "Human" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${message.who === "Human" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                <div
                  className={`mb-1 text-xs font-bold uppercase tracking-wide ${message.who === "Human" ? "text-indigo-100" : "text-slate-400"}`}
                >
                  {message.who}
                </div>
                {message.text}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
          <div className="flex-1 px-3 py-2 text-sm text-slate-400">
            Type the next instruction...
          </div>
          <button
            className="rounded-xl bg-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
            type="button"
          >
            Send
          </button>
        </div>
      </section>
    </main>
  );
}
