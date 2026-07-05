import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Agent Swarm Demo",
  description:
    "A live presentation tool that teaches what an AI agent and an agent swarm are with task maps and swarm workflows.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Only load on Vercel: the insights script 404s (console errors) on
            local production servers and in e2e runs. */}
        {process.env.VERCEL ? <Analytics /> : null}
      </body>
    </html>
  );
}
