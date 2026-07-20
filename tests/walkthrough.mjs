// Presenter-facing route walkthrough. Interaction depth belongs in e2e.mjs;
// this file makes each screen's basic clarity and layout contract repeatable.
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE || "http://localhost:3000";
const viewports = [
  { name: "constrained laptop", width: 1366, height: 768 },
  { name: "laptop", width: 1440, height: 900 },
  { name: "projector", width: 1920, height: 1080 },
];
const routes = [
  { path: "/", name: "landing", text: /Manual Game/i },
  { path: "/manual", name: "manual", text: /Manual Game/i, label: /Manual drag room/i },
  { path: "/chat", name: "chat", text: /Chat/i, label: /Prompt/i },
  { path: "/tool-use", name: "tool use", text: /Tool Use/i, label: /Top-down tool-use room/i },
  { path: "/agent", name: "single agent", text: /Single Agent/i, label: /Top-down cleaning room/i },
  { path: "/team", name: "small team", text: /1 Manager/i, label: /Top-down small team two-room house/i },
  { path: "/swarm", name: "swarm", text: /Swarm House/i, label: /Top-down swarm facility/i },
  { path: "/room", name: "legacy room redirect", redirect: "/agent", text: /Single Agent/i },
  { path: "/warehouse", name: "legacy warehouse redirect", redirect: "/swarm", text: /Swarm House/i },
];

const results = [];
let failures = 0;
function check(name, condition, detail = "") {
  if (!condition) failures += 1;
  results.push(`${condition ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function run() {
  const browser = await chromium.launch(process.env.E2E_CHROMIUM ? { executablePath: process.env.E2E_CHROMIUM } : {});
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      const beforeConsole = consoleErrors.length;
      const beforePageErrors = pageErrors.length;
      await page.goto(`${BASE}${route.path}`, { waitUntil: "networkidle" });
      const descriptor = `${route.name} at ${viewport.name}`;
      check(`${descriptor} renders its primary message`, await page.getByText(route.text).count() > 0);
      if (route.label) check(`${descriptor} exposes its interaction anchor`, await page.getByLabel(route.label).count() > 0);
      if (route.redirect) check(`${descriptor} reaches its canonical route`, new URL(page.url()).pathname === route.redirect, page.url());
      const layout = await page.evaluate(() => ({
        hasMain: Boolean(document.querySelector("main")),
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      }));
      check(`${descriptor} has a page landmark`, layout.hasMain);
      check(`${descriptor} has no horizontal overflow`, !layout.horizontalOverflow);
      check(`${descriptor} has no new browser errors`, consoleErrors.length === beforeConsole && pageErrors.length === beforePageErrors,
        [...consoleErrors.slice(beforeConsole), ...pageErrors.slice(beforePageErrors)].join(" | "));
    }
  }

  await browser.close();
  console.log("\n==== WALKTHROUGH RESULTS ====");
  for (const result of results) console.log(result);
  console.log(`\n${failures === 0 ? "ALL PASSED" : `${failures} FAILURE(S)`}`);
  process.exit(failures === 0 ? 0 : 1);
}

run().catch((error) => {
  console.error("Walkthrough crashed:", error);
  process.exit(2);
});
