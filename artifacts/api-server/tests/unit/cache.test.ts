import { describe, it, expect, beforeEach } from "vitest";
import { getCached, setCached, clearCache, getCacheStats, evictExpired } from "../../src/components/retrieval/retrievalCache.js";
import type { RetrievalResult } from "../../src/components/registryV2/registryTypes.js";

const makeResult = (id = "test"): RetrievalResult => ({
  components: [{ id, category: "hero", score: 10, description: "test", name: "Test", matchReasons: [] }],
  intent: { industry: ["saas"], style: ["modern"], pageType: "saas", keywords: [], sections: ["hero"], conversionGoal: ["signup"] },
  retrievalMs: 5,
  cacheHit: false,
  promptTokenEstimate: 50,
});

describe("Retrieval Cache", () => {
  beforeEach(() => {
    clearCache();
  });

  it("getCached returns null for missing key", () => {
    expect(getCached("nonexistent-key")).toBeNull();
  });

  it("setCached + getCached returns stored value", () => {
    const result = makeResult("hero-001");
    setCached("key-1", result);
    const retrieved = getCached("key-1");
    expect(retrieved).not.toBeNull();
    expect(retrieved!.components[0].id).toBe("hero-001");
  });

  it("getCacheStats size increments after set", () => {
    setCached("key-a", makeResult("a"));
    setCached("key-b", makeResult("b"));
    const stats = getCacheStats();
    expect(stats.size).toBe(2);
  });

  it("clearCache empties the store", () => {
    setCached("key-x", makeResult());
    setCached("key-y", makeResult());
    clearCache();
    expect(getCacheStats().size).toBe(0);
  });

  it("getCacheStats has all required fields", () => {
    const stats = getCacheStats();
    expect(stats).toHaveProperty("size");
    expect(stats).toHaveProperty("maxEntries");
    expect(stats).toHaveProperty("ttlMs");
    expect(stats).toHaveProperty("cacheHits");
    expect(stats).toHaveProperty("cacheMisses");
    expect(stats).toHaveProperty("hitRate");
  });

  it("TTL is set to 15 minutes", () => {
    const stats = getCacheStats();
    expect(stats.ttlMs).toBe(15 * 60 * 1000);
  });

  it("getCached returns null for expired entry", async () => {
    const realDateNow = Date.now;
    const result = makeResult();
    setCached("expire-key", result);

    Date.now = () => realDateNow() + 16 * 60 * 1000;
    const expired = getCached("expire-key");
    Date.now = realDateNow;

    expect(expired).toBeNull();
  });

  it("evictExpired removes stale entries", () => {
    const realDateNow = Date.now;
    setCached("evict-1", makeResult("e1"));
    setCached("evict-2", makeResult("e2"));

    Date.now = () => realDateNow() + 16 * 60 * 1000;
    const evicted = evictExpired();
    Date.now = realDateNow;

    expect(evicted).toBe(2);
    expect(getCacheStats().size).toBe(0);
  });

  it("stores multiple independent entries", () => {
    for (let i = 0; i < 10; i++) {
      setCached(`key-${i}`, makeResult(`comp-${i}`));
    }
    expect(getCacheStats().size).toBe(10);
    for (let i = 0; i < 10; i++) {
      expect(getCached(`key-${i}`)).not.toBeNull();
    }
  });
});
