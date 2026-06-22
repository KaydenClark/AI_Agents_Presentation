// End-to-end smoke test for the game modes, driven with a real browser.
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
  const landingShell = page.locator("main").first();
  const landingStyles = await landingShell.evaluate((el) => {
    const styles = window.getComputedStyle(el);
    return {
      backgroundColor: styles.backgroundColor,
      color: styles.color,
      display: styles.display,
    };
  });
  check("Landing CSS bundle is applied",
    landingStyles.backgroundColor === "rgb(10, 10, 10)" &&
    landingStyles.color === "rgb(247, 247, 247)" &&
    landingStyles.display === "flex",
    `bg=${landingStyles.backgroundColor}, color=${landingStyles.color}, display=${landingStyles.display}`);
  check("Landing has all six game mode links",
    (await page.getByRole("link", { name: /Manual Game/i }).count()) > 0 &&
    (await page.getByRole("link", { name: /Chat Window/i }).count()) > 0 &&
    (await page.getByRole("link", { name: /Tool Use/i }).count()) > 0 &&
    (await page.getByRole("link", { name: /Single Agent/i }).count()) > 0 &&
    (await page.getByRole("link", { name: /Small Team/i }).count()) > 0 &&
    (await page.getByRole("link", { name: /Swarm House/i }).count()) > 0);

  // ---------- Mode 1: Manual Game ----------
  await page.goto(`${BASE}/manual`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  check("Manual Game shows a drag task list with destinations",
    (await page.getByText(/Trash -> Trash can/i).count()) > 0 &&
    (await page.getByText(/Cup -> Sink/i).count()) > 0 &&
    (await page.getByText(/Book -> Bookshelf/i).count()) > 0);
  check("Manual Game shows top-down drag room",
    (await page.getByLabel(/Manual drag room/i).count()) > 0 &&
    (await page.getByText(/Trash can/i).count()) > 0 &&
    (await page.getByText(/Bookshelf/i).count()) > 0);
  check("Manual Game: no agent worker present",
    (await page.getByText(/Agent worker/i).count()) === 0);

  const manualMoves = [
    ["Trash", "Trash can"],
    ["Cup", "Sink"],
    ["Book", "Bookshelf"],
  ];
  for (const [item, dest] of manualMoves) {
    await page.getByRole("button", { name: new RegExp(`^${item} item`, "i") }).click();
    await page.getByRole("button", { name: new RegExp(`^${dest} destination`, "i") }).click();
  }
  check("Manual Game: player can put every item where it belongs",
    (await page.getByText(/Manual room complete/i).count()) > 0);

  await page.getByRole("button", { name: /Reset/i }).click();
  await page.waitForTimeout(200);
  check("Manual Game: Reset restores three draggable items",
    (await page.getByText(/3 jobs left/i).count()) > 0);

  // ---------- Mode 2: Chat Window ----------
  await page.goto(`${BASE}/chat`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const chatStartCount = await itemsLeft(page);
  await page.getByLabel(/Prompt/i).fill("tidy the room");
  await page.getByRole("button", { name: "Submit" }).click();
  check("Chat: produces an answer",
    (await page.getByText(/Here is a plan/i).count()) > 0);
  check("Chat: room state does not change from output alone",
    (await itemsLeft(page)) === chatStartCount,
    `started ${chatStartCount}, now ${await itemsLeft(page)}`);

  // ---------- Mode 3: Tool Use ----------
  await page.goto(`${BASE}/tool-use`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  const startCount = await itemsLeft(page);
  check("Tool Use starts with 6-8 messes", startCount >= 6 && startCount <= 8, `got ${startCount}`);
  check("Tool Use shows top-down tool room",
    (await page.getByLabel(/Top-down tool-use room/i).count()) > 0 &&
    (await page.getByText(/Bookshelf tool/i).count()) > 0 &&
    (await page.getByText(/Sink tool/i).count()) > 0);
  check("Tool Use: no agent worker present",
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
  check("Tool Use: each submit clears exactly one item (no double-processing)", stepBugs === 0, `${stepBugs} anomalies`);
  check("Tool Use: room reaches 0 items", prev === 0, `ended at ${prev}`);
  check("Tool Use: 'Room clean' indicator appears",
    (await page.getByText(/Room clean/i).count()) > 0);
  check("Tool Use: progress bar reads done",
    (await page.getByText(new RegExp(`${startCount}/${startCount} done`)).count()) > 0);
  check("Tool Use: submit disabled when all tasks are done",
    await page.getByRole("button", { name: "Submit" }).isDisabled());

  await page.getByRole("button", { name: /Reset room/i }).click();
  await page.waitForTimeout(300);
  check("Tool Use: Reset restocks the room", (await itemsLeft(page)) === startCount);

  // Repetition nudge appears after a few manual submits.
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Submit" }).click();
    await waitIdleOrClean(page);
  }
  check("Tool Use: nudge to try Agent mode appears after repeated submits",
    (await page.getByText(/Getting repetitive/i).count()) > 0);

  // ---------- Mode 4: Single Agent ----------
  await page.goto(`${BASE}/agent`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  check("Agent: starts with a full room", (await itemsLeft(page)) === startCount);
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

  // ---------- Mode 4: route controls locked while busy ----------
  await page.getByRole("button", { name: /Reset room/i }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Submit" }).click();
  await page.waitForTimeout(900);
  check("Agent: dedicated route has no manual-mode toggle",
    (await page.getByRole("button", { name: "manual" }).count()) === 0);
  check("Agent: Reset is disabled mid-run",
    await page.getByRole("button", { name: /Reset room/i }).isDisabled());
  let lockRunCleared = false;
  const lockRunStart = Date.now();
  while (Date.now() - lockRunStart < 45000) {
    if ((await page.getByText(/Room clean/i).count()) > 0 && (await itemsLeft(page)) === 0) {
      lockRunCleared = true; break;
    }
    await sleep(300);
  }
  check("Agent: locked busy run still completes", lockRunCleared);

  // ---------- Mode 5: Small Team ----------
  await page.goto(`${BASE}/team`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  check("Team shows manager and two agents",
    (await page.getByText(/1 Manager/i).count()) > 0 &&
    (await page.getByText(/2 Agents/i).count()) > 0);
  await page.getByRole("button", { name: "Submit" }).click();
  let teamDone = false;
  const teamStart = Date.now();
  while (Date.now() - teamStart < 30000) {
    if ((await page.getByText(/Team report delivered/i).count()) > 0) { teamDone = true; break; }
    await sleep(300);
  }
  check("Team: one manager splits work across two agents", teamDone);
  check("Team: both agents report complete",
    (await page.getByText(/Agent [AB]: complete/i).count()) === 2,
    `${await page.getByText(/Agent [AB]: complete/i).count()} agents`);
  check("Team uses a two-room house with a left mess room and right work room",
    (await page.getByText(/Messy living room/i).count()) > 0 &&
    (await page.getByText(/Team work room/i).count()) > 0 &&
    (await page.getByText(/Play room mess/i).count()) === 0 &&
    (await page.getByText(/Kitchen work room/i).count()) === 0 &&
    (await page.getByText(/Laundry work room/i).count()) === 0);

  // ---------- Mode 6: Swarm ----------
  await page.goto(`${BASE}/swarm`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  check("Warehouse shows top-down facility map",
    (await page.getByLabel(/Top-down swarm facility/i).count()) > 0 &&
    (await page.getByText(/Boss office/i).count()) > 0 &&
    (await page.getByText(/Report paths/i).count()) > 0);
  check("Warehouse uses fixed Clean the house instruction",
    (await page.getByText(/Fixed human instruction/i).count()) > 0 &&
    (await page.getByText(/^Clean the house$/i).count()) > 0);
  await page.getByRole("button", { name: "Submit" }).click();

  const decisionStart = Date.now();
  let bossDecision = false;
  while (Date.now() - decisionStart < 20000) {
    if ((await page.getByText(/Boss decision: why each Manager got this work/i).count()) > 0) {
      bossDecision = true; break;
    }
    await sleep(300);
  }
  check("Warehouse: Boss decision panel appears", bossDecision);
  check("Warehouse: Managers produce per-agent plans",
    (await page.getByText(/Manager (AI|fallback)/).count()) === 3,
    `${await page.getByText(/Manager (AI|fallback)/).count()} manager badges`);

  await page.getByRole("button", { name: /Plate/i }).click();
  const map = page.getByLabel(/Top-down swarm facility/i).first();
  const box = await map.boundingBox();
  if (box) {
    await map.click({
      position: { x: box.width * 0.25, y: box.height * 0.48 },
    });
  }
  let spawnedWork = false;
  const spawnStart = Date.now();
  while (Date.now() - spawnStart < 12000) {
    spawnedWork = (await page.getByText(/Player dropped a plate/i).count()) > 0;
    if (spawnedWork) break;
    await sleep(250);
  }
  check("Warehouse: player can spawn one palette item into the live house", spawnedWork);
  if (box) {
    await map.click({
      position: { x: box.width * 0.35, y: box.height * 0.62 },
    });
  }
  let secondSpawnedWork = false;
  const secondSpawnStart = Date.now();
  while (Date.now() - secondSpawnStart < 12000) {
    secondSpawnedWork = (await page.getByText(/Player dropped a plate/i).count()) >= 2;
    if (secondSpawnedWork) break;
    await sleep(250);
  }
  check("Warehouse: selected palette item stays armed for repeated drops", secondSpawnedWork);

  const whStart = Date.now();
  let finalReport = false;
  while (Date.now() - whStart < 50000) {
    if ((await page.getByText(/Final report to the human/i).count()) > 0) { finalReport = true; break; }
    await sleep(400);
  }
  check("Warehouse: produces a final report", finalReport);
  check("Warehouse: final report includes player-added work",
    (await page.getByText(/player-added item/i).count()) > 0);
  check("Warehouse: all 3 manager rooms report complete",
    (await page.getByText(/^Reported$/).count()) === 3,
    `${await page.getByText(/^Reported$/).count()} rooms`);

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
  console.log(`\n${failures === 0 ? "ALL PASSED" : `${failures} FAILURE(S)`}`);
  process.exit(failures === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error("Workbench crashed:", e);
  process.exit(2);
});
