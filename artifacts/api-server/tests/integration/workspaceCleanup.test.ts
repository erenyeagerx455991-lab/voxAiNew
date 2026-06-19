import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  registerWorkspace, unregisterWorkspace, getStaleWorkspaces,
  getRegistryStats, listWorkspaces, clearRegistry, touchWorkspace,
  setWorkspaceStatus, type WorkspaceEntry,
} from "../../src/workspace/workspaceRegistry.js";

function makeEntry(overrides: Partial<WorkspaceEntry> = {}): Omit<WorkspaceEntry, 'createdAt' | 'lastAccessedAt'> {
  return {
    workspaceId: `ws-${Math.random().toString(36).slice(2, 8)}`,
    buildId: "build-test",
    userId: "user-cleanup",
    path: "/tmp/nexogen-runs/test",
    status: "active",
    ...overrides,
  };
}

describe("Workspace Registry", () => {
  beforeEach(() => {
    clearRegistry();
  });

  it("registerWorkspace stores an entry", () => {
    const entry = makeEntry();
    registerWorkspace(entry);
    const stats = getRegistryStats();
    expect(stats.total).toBe(1);
  });

  it("getRegistryStats counts by status", () => {
    registerWorkspace(makeEntry({ status: "active", workspaceId: "ws-a1" }));
    registerWorkspace(makeEntry({ status: "active", workspaceId: "ws-a2" }));
    registerWorkspace(makeEntry({ status: "creating", workspaceId: "ws-c1" }));
    const stats = getRegistryStats();
    expect(stats.byStatus.active).toBe(2);
    expect(stats.byStatus.creating).toBe(1);
  });

  it("unregisterWorkspace removes entry", () => {
    const entry = makeEntry({ workspaceId: "ws-remove" });
    registerWorkspace(entry);
    expect(getRegistryStats().total).toBe(1);
    unregisterWorkspace("ws-remove");
    expect(getRegistryStats().total).toBe(0);
  });

  it("touchWorkspace updates lastAccessedAt", () => {
    const entry = makeEntry({ workspaceId: "ws-touch" });
    const stored = registerWorkspace(entry);
    const before = stored.lastAccessedAt;
    const realNow = Date.now;
    Date.now = () => realNow() + 5000;
    touchWorkspace("ws-touch");
    Date.now = realNow;
    const all = listWorkspaces();
    const ws = all.find(w => w.workspaceId === "ws-touch");
    expect(ws!.lastAccessedAt).toBeGreaterThan(before);
  });

  it("getStaleWorkspaces returns entries older than maxAgeMs", () => {
    const entry = makeEntry({ workspaceId: "ws-stale" });
    registerWorkspace(entry);
    const stale = getStaleWorkspaces(0);
    expect(stale.some(w => w.workspaceId === "ws-stale")).toBe(true);
  });

  it("getStaleWorkspaces excludes 'creating' status entries", () => {
    const entry = makeEntry({ workspaceId: "ws-creating", status: "creating" });
    registerWorkspace(entry);
    const stale = getStaleWorkspaces(0);
    expect(stale.some(w => w.workspaceId === "ws-creating")).toBe(false);
  });

  it("listWorkspaces filters by userId", () => {
    registerWorkspace(makeEntry({ workspaceId: "ws-u1", userId: "alice" }));
    registerWorkspace(makeEntry({ workspaceId: "ws-u2", userId: "bob" }));
    const alice = listWorkspaces({ userId: "alice" });
    expect(alice).toHaveLength(1);
    expect(alice[0].userId).toBe("alice");
  });

  it("listWorkspaces filters by status", () => {
    registerWorkspace(makeEntry({ workspaceId: "ws-s1", status: "active" }));
    registerWorkspace(makeEntry({ workspaceId: "ws-s2", status: "deleted" }));
    const active = listWorkspaces({ status: "active" });
    expect(active).toHaveLength(1);
  });

  it("setWorkspaceStatus updates status field", () => {
    registerWorkspace(makeEntry({ workspaceId: "ws-status" }));
    setWorkspaceStatus("ws-status", "cleaning");
    const all = listWorkspaces({ status: "cleaning" });
    expect(all).toHaveLength(1);
  });

  it("clearRegistry empties all entries", () => {
    for (let i = 0; i < 5; i++) {
      registerWorkspace(makeEntry({ workspaceId: `ws-bulk-${i}` }));
    }
    clearRegistry();
    expect(getRegistryStats().total).toBe(0);
  });
});
