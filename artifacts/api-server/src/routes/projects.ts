/**
 * Projects Route — save, list, fetch, rename, and delete generated projects.
 *
 * User identity is always derived server-side via extractUserId(req).
 * The client never supplies a userId; any userId in the request body is ignored.
 * Every write and read that targets a specific project first verifies ownership.
 */

import { Router } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, projectsTable } from "@workspace/db";
import { createLogger } from "../lib/structuredLogger.js";
import { extractUserId } from "../limits/userLimits.js";

const log = createLogger("ProjectsRoute");
const router = Router();

// ── POST /projects ──────────────────────────────────────────────────────────────
// Upsert a project by chatId. userId is derived server-side; any client-supplied
// userId field in the body is intentionally ignored.
router.post("/projects", async (req, res) => {
  try {
    const userId = extractUserId(req);

    const { chatId, title, prompt, files, fileCount, previewHtml, healthScore } =
      req.body as {
        chatId: string;
        title: string;
        prompt: string;
        files: Array<{ name: string; content: string; lang: string; path: string }>;
        fileCount: number;
        previewHtml?: string;
        healthScore?: number;
      };

    if (!chatId || !title) {
      res.status(400).json({ error: "chatId and title are required" });
      return;
    }

    // On conflict (same chatId) only allow update if the stored userId matches.
    // We achieve this by including userId in the conflict resolution set so a
    // different caller's upsert will simply overwrite with their own userId —
    // but then their subsequent reads will return 404 for the original owner.
    // More importantly, the ownership check on GET/PATCH/DELETE blocks cross-user
    // access even if chatId is guessed.
    const [project] = await db
      .insert(projectsTable)
      .values({
        chatId,
        userId,
        title,
        prompt: prompt ?? "",
        files: files ?? [],
        fileCount: fileCount ?? 0,
        previewHtml: previewHtml ?? null,
        healthScore: healthScore ?? null,
      })
      .onConflictDoUpdate({
        target: projectsTable.chatId,
        // Only update if the stored userId matches the requester — prevents a
        // different identity from overwriting another user's project data.
        setWhere: eq(projectsTable.userId, userId),
        set: {
          title,
          prompt: prompt ?? "",
          files: files ?? [],
          fileCount: fileCount ?? 0,
          previewHtml: previewHtml ?? null,
          healthScore: healthScore ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!project) {
      // setWhere did not match — chatId belongs to a different user
      res.status(403).json({ error: "Not authorized to update this project" });
      return;
    }

    log.info("project_upserted", { chatId, fileCount, userId });
    res.json({ project });
  } catch (err) {
    log.error("upsert_failed", { err: String(err) });
    res.status(500).json({ error: "Failed to save project" });
  }
});

// ── GET /projects ───────────────────────────────────────────────────────────────
// List all projects for the requesting identity. No query param accepted.
router.get("/projects", async (req, res) => {
  try {
    const userId = extractUserId(req);

    const rows = await db
      .select({
        id: projectsTable.id,
        chatId: projectsTable.chatId,
        userId: projectsTable.userId,
        title: projectsTable.title,
        prompt: projectsTable.prompt,
        fileCount: projectsTable.fileCount,
        healthScore: projectsTable.healthScore,
        createdAt: projectsTable.createdAt,
        updatedAt: projectsTable.updatedAt,
      })
      .from(projectsTable)
      .where(eq(projectsTable.userId, userId))
      .orderBy(desc(projectsTable.updatedAt));

    res.json({ projects: rows });
  } catch (err) {
    log.error("list_failed", { err: String(err) });
    res.status(500).json({ error: "Failed to list projects" });
  }
});

// ── GET /projects/:chatId ───────────────────────────────────────────────────────
// Fetch a full project including files. Returns 404 if not owned by requester.
router.get("/projects/:chatId", async (req, res) => {
  try {
    const userId = extractUserId(req);
    const { chatId } = req.params;

    const [project] = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.chatId, chatId), eq(projectsTable.userId, userId)))
      .limit(1);

    if (!project) {
      // Return 404 regardless of whether it exists — avoids leaking existence
      res.status(404).json({ error: "Project not found" });
      return;
    }

    res.json({ project });
  } catch (err) {
    log.error("fetch_failed", { err: String(err) });
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// ── PATCH /projects/:chatId ─────────────────────────────────────────────────────
// Rename a project. Returns 404 if not owned by requester.
router.patch("/projects/:chatId", async (req, res) => {
  try {
    const userId = extractUserId(req);
    const { chatId } = req.params;
    const { title } = req.body as { title: string };

    if (!title?.trim()) {
      res.status(400).json({ error: "title is required" });
      return;
    }

    const [updated] = await db
      .update(projectsTable)
      .set({ title: title.trim(), updatedAt: new Date() })
      .where(and(eq(projectsTable.chatId, chatId), eq(projectsTable.userId, userId)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    res.json({ project: updated });
  } catch (err) {
    log.error("rename_failed", { err: String(err) });
    res.status(500).json({ error: "Failed to rename project" });
  }
});

// ── DELETE /projects/:chatId ────────────────────────────────────────────────────
// Delete a project. Silently no-ops if not owned by requester (avoids leaking existence).
router.delete("/projects/:chatId", async (req, res) => {
  try {
    const userId = extractUserId(req);
    const { chatId } = req.params;

    await db
      .delete(projectsTable)
      .where(and(eq(projectsTable.chatId, chatId), eq(projectsTable.userId, userId)));

    log.info("project_deleted", { chatId, userId });
    res.json({ ok: true });
  } catch (err) {
    log.error("delete_failed", { err: String(err) });
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
