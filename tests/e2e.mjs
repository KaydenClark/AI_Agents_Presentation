// End-to-end smoke test for both scenes, driven with a real browser.
//
//   1. npm run dev                       # serves on :3000
//   2. npx playwright install chromium   # one-time, downloads the browser
//   3. npm run test:e2e                  # in another terminal
//
// Point at a different origin with E2E_BASE, e.g.
//   E2E_BASE=http://localhost:3100 npm run test:e2e
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE || "http://localhost:3000";
const results = [];
let failures = 0;

function check(name, cond, detail = "") {
  const ok = !!cond;
  if (!ok) failures++;
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function itemsLeft(page) {
  const txt = await page.getByText(/item(s)? left/i).first().innerText();
  const m = txt.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : NaN;
}

async function submitEnabled(page) {
  return !(await page.getByRole("button", { name: "Submit" }).isDisabled());
}

async function waitSubmitEnabled(page, timeout = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await submitEnabled(page)) return true;
    await sleep(120);
  }
  return false;
}

// After a manual step, Submit re-enables UNLESS that step cleared the last
// task (all done -> Submit stays disabled by design).
async function waitIdleOrClean(page, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await submitEnabled(page)) return true;
    if ((await page.getByText(/Room clean/i).count()) > 0) return true;
    await sleep(120);
  }
  return false;
}

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => pageErrors.push(e.message));

  // ---------- Landing ----------
  await page.goto(BASE, { waitUntil: "networkidle" });
  check("Landing has both scene links",
    (await page.getByRole("link", { name: /Single Room/i }).count()) > 0 &&
    (await page.getByRole("link", { name: /Swarm Warehouse/i }).count()) > 0);

  // ---------- Scene 1: Manual ----------
  await page.goto(`${BASE}/room`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  const startCount = await itemsLeft(page);
  check("Room starts with 6-8 messes", startCount >= 6 && startCount <= 8, `got ${startCount}`);
  check("Room shows top-down cleaning room",
    (await page.getByLabel(/Top-down cleaning room/i).count()) > 0 &&
    (await page.getByText(/Trash can/i).count()) > 0 &&
    (await page.getByText(/Laundry hamper/i).count()) > 0);
  check("Manual mode: no agent worker present",
    (await page.getByText(/Agent worker/i).count()) === 0);

  let prev = startCount;
  let stepBugs = 0;
  for (let i = 0; i < startCount; i++) {
    await page.getByRole("button", { name: "Submit" }).click();
    await page.getByRole("button", { name: "Submit" }).click({ force: true }).catch(() => {});
    const ok = await waitIdleOrClean(page);
    if (!ok) { stepBugs++; break; }
    const now = await itemsLeft(page);
    if (now !== prev - 1) stepBugs++;
    prev = now;
  }
  check("Manual: each submit clears exactly one item (no double-processing)", stepBugs === 0, `${stepBugs} anomalies`);
  check("Manual: room reaches 0 items", prev === 0, `ended at ${prev}`);
  check("Manual: 'Room clean' indicator appears",
    (await page.getByText(/Room clean/i).count()) > 0);
  check("Manual: progress bar reads done",
    (await page.getByText(new RegExp(`${startCount}/${startCount} done`)).count()) > 0);
  check("Manual: submit disabled when all tasks are done",
    await page.getByRole("button", { name: "Submit" }).isDisabled());

  await page.getByRole("button", { name: /Reset room/i }).click();
  await page.waitForTimeout(300);
  check("Manual: Reset restocks the room", (await itemsLeft(page)) === startCount);

  // Repetition nudge appears after a few manual submits.
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Submit" }).click();
    await waitIdleOrClean(page);
  }
  check("Manual: nudge to try Agent mode appears after repeated submits",
    (await page.getByText(/Getting repetitive/i).count()) > 0);

  // ---------- Scene 1: Agent ----------
  await page.getByRole("button", { name: "agent" }).click();
  await page.waitForTimeout(500);
  check("Agent: switching mode resets to full room", (await itemsLeft(page)) === startCount);
  check("Agent: agent worker is present",
    (await page.getByText(/Agent worker/i).count()) > 0);

  await page.getByRole("button", { name: "Submit" }).click();
  const agentStart = Date.now();
  let agentCleared = false;
  while (Date.now() - agentStart < 45000) {
    if ((await page.getByText(/Room clean/i).count()) > 0 && (await itemsLeft(page)) === 0) {
      agentCleared = true; break;
    }
    await sleep(300);
  }
  check("Agent: one submit cleans the whole room on its own", agentCleared);
  check("Agent: loop self-terminates (submit disabled at end)",
    await page.getByRole("button", { name: "Submit" }).isDisabled());

  // ---------- Scene 1: mode toggle locked while busy ----------
  await page.getByRole("button", { name: /Reset room/i }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Submit" }).click();
  await page.waitForTimeout(900);
  check("Agent: mode toggle is disabled mid-run (prevents broken state)",
    await page.getByRole("button", { name: "manual" }).isDisabled());
  check("Agent: Reset is disabled mid-run",
    await page.getByRole("button", { name: /Reset room/i }).isDisabled());
  await waitSubmitEnabled(page);

  // ---------- Scene 2: Warehouse ----------
  await page.goto(`${BASE}/warehouse`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  check("Warehouse shows top-down facility map",
    (await page.getByLabel(/Top-down swarm facility/i).count()) > 0 &&
    (await page.getByText(/Boss office/i).count()) > 0 &&
    (await page.getByText(/Report paths/i).count()) > 0);
  await page.getByRole("button", { name: "Submit" }).click();

  const whStart = Date.now();
  let finalReport = false;
  while (Date.now() - whStart < 50000) {
    if ((await page.getByText(/Final report to the human/i).count()) > 0) { finalReport = true; break; }
    await sleep(400);
  }
  check("Warehouse: produces a final report", finalReport);
  check("Warehouse: all 6 rooms report complete",
    (await page.getByText(/Reported ✓/).count()) === 6,
    `${await page.getByText(/Reported ✓/).count()} rooms`);

  await page.getByRole("button", { name: "Reset" }).click();
  await page.waitForTimeout(300);
  await page.getByLabel(/Presenter tools/i).check();
  await page.getByRole("button", { name: "Submit" }).click();
  await page.waitForTimeout(1000);
  const jamBtns = page.getByRole("button", { name: /Jam/ });
  let humanBanner = false;
  if ((await jamBtns.count()) > 0) {
    await jamBtns.first().click().catch(() => {});
    await page.waitForTimeout(700);
    humanBanner = (await page.getByText(/Needs human input/i).count()) > 0;
    const resolve = page.getByRole("button", { name: /Resolve/i });
    if ((await resolve.count()) > 0) await resolve.click().catch(() => {});
  }
  check("Warehouse: Jam button surfaces a 'Needs human input' exit point", humanBanner);

  // ---------- Console / page errors ----------
  check("No uncaught page errors", pageErrors.length === 0, pageErrors.join(" | "));
  check("No console errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));

  await browser.close();

  console.log("\n==== TEST RESULTS ====");
  for (const r of results) console.log(r);
  console.log(`\n${failures === 0 ? "ALL PASSED ✅" : `${failures} FAILURE(S) ❌`}`);
  process.exit(failures === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error("Harness crashed:", e);
  process.exit(2);
});
