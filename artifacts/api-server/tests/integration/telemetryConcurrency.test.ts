import { describe, it, expect } from "vitest";
import { runWithContext, getContext } from "../../src/telemetry/contextStore.js";

describe("Telemetry Concurrency — AsyncLocalStorage isolation", () => {
  it("isolates traceId between two concurrent build contexts", async () => {
    const logsA: string[] = [];
    const logsB: string[] = [];

    const buildA = runWithContext({ traceId: "trace-A", buildId: "build-A" }, async () => {
      logsA.push(getContext().traceId!);
      await new Promise(r => setTimeout(r, 10));
      logsA.push(getContext().traceId!);
      await new Promise(r => setTimeout(r, 10));
      logsA.push(getContext().traceId!);
    });

    const buildB = runWithContext({ traceId: "trace-B", buildId: "build-B" }, async () => {
      logsB.push(getContext().traceId!);
      await new Promise(r => setTimeout(r, 5));
      logsB.push(getContext().traceId!);
      await new Promise(r => setTimeout(r, 15));
      logsB.push(getContext().traceId!);
    });

    await Promise.all([buildA, buildB]);

    expect(logsA).toHaveLength(3);
    expect(logsB).toHaveLength(3);

    for (const id of logsA) expect(id).toBe("trace-A");
    for (const id of logsB) expect(id).toBe("trace-B");

    expect(logsA.some(id => id === "trace-B")).toBe(false);
    expect(logsB.some(id => id === "trace-A")).toBe(false);
  });

  it("isolates buildId between concurrent contexts", async () => {
    const buildIds: Record<string, string[]> = { A: [], B: [], C: [] };

    await Promise.all([
      runWithContext({ buildId: "build-A" }, async () => {
        for (let i = 0; i < 3; i++) {
          buildIds.A.push(getContext().buildId!);
          await new Promise(r => setTimeout(r, 5));
        }
      }),
      runWithContext({ buildId: "build-B" }, async () => {
        for (let i = 0; i < 3; i++) {
          buildIds.B.push(getContext().buildId!);
          await new Promise(r => setTimeout(r, 7));
        }
      }),
      runWithContext({ buildId: "build-C" }, async () => {
        for (let i = 0; i < 3; i++) {
          buildIds.C.push(getContext().buildId!);
          await new Promise(r => setTimeout(r, 3));
        }
      }),
    ]);

    for (const id of buildIds.A) expect(id).toBe("build-A");
    for (const id of buildIds.B) expect(id).toBe("build-B");
    for (const id of buildIds.C) expect(id).toBe("build-C");
  });

  it("nested async operations inherit parent context", async () => {
    const collected: string[] = [];

    await runWithContext({ traceId: "parent-trace", buildId: "parent-build" }, async () => {
      collected.push(getContext().traceId!);

      await new Promise<void>(resolve => {
        setTimeout(() => {
          collected.push(getContext().traceId!);
          resolve();
        }, 10);
      });

      await Promise.all([
        (async () => { await new Promise(r => setTimeout(r, 5)); collected.push(getContext().traceId!); })(),
        (async () => { await new Promise(r => setTimeout(r, 8)); collected.push(getContext().traceId!); })(),
      ]);
    });

    expect(collected.length).toBe(4);
    for (const id of collected) expect(id).toBe("parent-trace");
  });

  it("context outside runWithContext returns empty object", () => {
    const ctx = getContext();
    expect(ctx).toBeDefined();
    expect(typeof ctx).toBe("object");
  });

  it("setContext mutates only the current context store", async () => {
    let ctxAAfterSet = "";
    let ctxBAfterSet = "";

    const { setContext } = await import("../../src/telemetry/contextStore.js");

    await Promise.all([
      runWithContext({ traceId: "A-initial" }, async () => {
        await new Promise(r => setTimeout(r, 5));
        setContext({ traceId: "A-mutated" });
        await new Promise(r => setTimeout(r, 10));
        ctxAAfterSet = getContext().traceId!;
      }),
      runWithContext({ traceId: "B-initial" }, async () => {
        await new Promise(r => setTimeout(r, 10));
        ctxBAfterSet = getContext().traceId!;
      }),
    ]);

    expect(ctxAAfterSet).toBe("A-mutated");
    expect(ctxBAfterSet).toBe("B-initial");
  });
});
