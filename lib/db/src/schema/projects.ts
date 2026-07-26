import { pgTable, text, timestamp, uuid, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface StoredProjectFile {
  name: string;
  content: string;
  lang: string;
  path: string;
}

export const projectsTable = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: text("chat_id").notNull().unique(),
  userId: text("user_id").notNull().default("local"),
  title: text("title").notNull().default("Untitled Project"),
  prompt: text("prompt").notNull().default(""),
  files: jsonb("files").$type<StoredProjectFile[]>().notNull().default([]),
  fileCount: integer("file_count").notNull().default(0),
  previewHtml: text("preview_html"),
  healthScore: integer("health_score"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
