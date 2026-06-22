import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  chooseLiveAgent,
  fallbackManagerPlan,
  managerForPaletteItem,
  paletteItemById,
  rebalanceQueues,
} from "../lib/warehouseRules.ts";

describe("warehouse rules", () => {
  it("routes palette items to the right manager", () => {
    assert.equal(managerForPaletteItem("plate"), "KITCHEN");
    assert.equal(managerForPaletteItem("shirt"), "LAUNDRY");
    assert.equal(managerForPaletteItem("book"), "OFFICE");
    assert.equal(managerForPaletteItem("trash"), "OFFICE");
  });

  it("keeps palette items bounded to supported sprites", () => {
    assert.equal(paletteItemById("fork")?.item, "fork");
    assert.equal(paletteItemById("towel")?.category, "laundry");
    assert.equal(paletteItemById("not-real"), undefined);
  });

  it("splits manager work across two agents with deterministic fallback", () => {
    const plan = fallbackManagerPlan({
      managerId: "KITCHEN",
      agents: [{ id: "KITCHEN1" }, { id: "KITCHEN2" }],
      jobs: [
        { id: "j1", workUnits: 3 },
        { id: "j2", workUnits: 1 },
        { id: "j3", workUnits: 1 },
      ],
    });

    assert.equal(plan.source, "fallback");
    assert.equal(plan.agentQueues.length, 2);
    assert.deepEqual(
      plan.agentQueues.flatMap((queue) => queue.jobIds).sort(),
      ["j1", "j2", "j3"],
    );
    assert.ok(plan.agentQueues.every((queue) => queue.jobIds.length > 0));
  });

  it("chooses an idle agent before queueing more work on a busy agent", () => {
    const agent = chooseLiveAgent([
      { id: "A1", state: "working", queueLength: 0 },
      { id: "A2", state: "done", queueLength: 0 },
    ]);

    assert.equal(agent?.id, "A2");
  });

  it("rebalances one queued item from a backed-up sibling to an idle agent", () => {
    assert.deepEqual(
      rebalanceQueues({
        agents: [
          { id: "A1", state: "idle", queueLength: 0 },
          { id: "A2", state: "working", queueLength: 3 },
        ],
      }),
      { fromAgentId: "A2", toAgentId: "A1", count: 1 },
    );
  });
});
