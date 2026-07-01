/**
 * V8.1 — dnaPersistence.ts unit tests
 * File I/O is not tested here (that requires a live fs); only the metrics/state API.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  disablePersistence,
  enablePersistence,
  resetPersistenceMetrics,
  getPersistenceMetrics,
  incrementEvolutionCount,
  getEvolutionCount,
  scheduleSave,
} from "../../design-dna/dnaPersistence.js";

beforeEach(() => {
  disablePersistence();
  resetPersistenceMetrics();
});

describe("getPersistenceMetrics", () => {
  it("returns schemaVersion field", () => {
    const m = getPersistenceMetrics();
    expect(m.schemaVersion).toBe("8.1.0");
  });

  it("returns snapshotFile path in /tmp", () => {
    const m = getPersistenceMetrics();
    expect(m.snapshotFile).toContain("/tmp");
  });

  it("starts with evolutionCount 0", () => {
    expect(getPersistenceMetrics().evolutionCount).toBe(0);
  });

  it("lastSaveAt starts as null", () => {
    expect(getPersistenceMetrics().lastSaveAt).toBeNull();
  });
});

describe("incrementEvolutionCount / getEvolutionCount", () => {
  it("starts at 0 after reset", () => {
    expect(getEvolutionCount()).toBe(0);
  });

  it("increments correctly", () => {
    incrementEvolutionCount();
    incrementEvolutionCount();
    incrementEvolutionCount();
    expect(getEvolutionCount()).toBe(3);
  });

  it("reflects in getPersistenceMetrics", () => {
    incrementEvolutionCount();
    incrementEvolutionCount();
    expect(getPersistenceMetrics().evolutionCount).toBe(2);
  });
});

describe("disablePersistence / enablePersistence", () => {
  it("disablePersistence sets enabled to false", () => {
    disablePersistence();
    expect(getPersistenceMetrics().enabled).toBe(false);
  });

  it("enablePersistence sets enabled to true", () => {
    disablePersistence();
    enablePersistence();
    expect(getPersistenceMetrics().enabled).toBe(true);
  });
});

describe("scheduleSave", () => {
  it("does not throw when persistence is disabled", () => {
    disablePersistence();
    expect(() => scheduleSave(100)).not.toThrow();
  });

  it("marks saveScheduled when enabled", () => {
    enablePersistence();
    scheduleSave(100000); // very long delay so it does not fire
    expect(getPersistenceMetrics().saveScheduled).toBe(true);
    // cleanup: reset to avoid leaking timers
    resetPersistenceMetrics();
    disablePersistence();
  });

  it("does not double-schedule", () => {
    enablePersistence();
    scheduleSave(100000);
    scheduleSave(100000); // second call is a no-op
    expect(getPersistenceMetrics().saveScheduled).toBe(true);
    resetPersistenceMetrics();
    disablePersistence();
  });
});

describe("resetPersistenceMetrics", () => {
  it("clears evolution count", () => {
    incrementEvolutionCount();
    incrementEvolutionCount();
    resetPersistenceMetrics();
    expect(getEvolutionCount()).toBe(0);
  });

  it("clears lastSaveAt", () => {
    resetPersistenceMetrics();
    expect(getPersistenceMetrics().lastSaveAt).toBeNull();
  });

  it("clears saveScheduled", () => {
    resetPersistenceMetrics();
    expect(getPersistenceMetrics().saveScheduled).toBe(false);
  });
});
