import Link from "next/link";
import {
  AgentIcon,
  BossIcon,
  HumanIcon,
  ManagerIcon,
  ThoughtIcon,
} from "@/components/UiIcons";

const gameModes = [
  {
    href: "/manual",
    eyebrow: "Game mode 1",
    title: "Manual Game",
    icon: HumanIcon,
    color: "text-[#E0BD3E]",
    text: "You are the agent: drag each item to the destination where it belongs.",
  },
  {
    href: "/chat",
    eyebrow: "Game mode 2",
    title: "Chat Window",
    icon: ThoughtIcon,
    color: "text-[#1ABCBD]",
    text: "You type a prompt and get a useful answer, but the room state does not change.",
  },
  {
    href: "/tool-use",
    eyebrow: "Game mode 3",
    title: "Tool Use",
    icon: HumanIcon,
    color: "text-[#885A89]",
    text: "The chat window can use tools, but one Submit still produces one external action.",
  },
  {
    href: "/agent",
    eyebrow: "Game mode 4",
    title: "Single Agent",
    icon: AgentIcon,
    color: "text-[#4DAA57]",
    text: "One goal drives an agent through every next action until the room is actually clean.",
  },
  {
    href: "/team",
    eyebrow: "Game mode 5",
    title: "Small Team",
    icon: ManagerIcon,
    color: "text-[#CF4F84]",
    text: "One Manager splits the goal across two agents so parallel work becomes visible.",
  },
  {
    href: "/swarm",
    eyebrow: "Game mode 6",
    title: "Swarm House",
    icon: BossIcon,
    color: "text-[#3A7CA5]",
    text: "A Boss, three Managers, and six Agents plan, execute, report, and absorb live new work.",
  },
];

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-[#0A0A0A] px-6 py-12 text-[#F7F7F7]">
      <header className="max-w-3xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#1ABCBD]">
          Learn by playing
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-[#F7F7F7] sm:text-5xl">
          Chat window, or AI agent?
        </h1>
        <p className="mt-4 text-lg text-zinc-300">
          Six short game modes make the ladder visible: doing the task
          yourself, getting chat output, using tools, giving one agent a goal,
          coordinating a small team, and letting a full swarm adapt live.
        </p>
      </header>

      <div className="grid w-full max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {gameModes.map((mode, index) => {
          const Icon = mode.icon;
          return (
            <Link
              key={mode.href}
              href={mode.href}
              className="group flex min-h-64 flex-col rounded-lg border border-[#474747] bg-[#191919] p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#3A7CA5] hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <Icon className={`h-10 w-10 ${mode.color}`} />
                <span className="rounded-full border border-[#474747] px-2 py-0.5 text-xs font-bold text-zinc-400">
                  {index + 1}
                </span>
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-wide text-[#1ABCBD]">
                {mode.eyebrow}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[#F7F7F7]">
                {mode.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-zinc-300">
                {mode.text}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#1ABCBD] group-hover:gap-3">
                Play mode
                <span aria-hidden>→</span>
              </span>
            </Link>
          );
        })}
      </div>

      <footer className="text-center text-sm text-zinc-500">
        Each browser tab is its own private session. Open this on your own
        laptop and follow along.
      </footer>
    </main>
  );
}
