import type { Response } from "express";

export function sse(res: Response, data: object): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}
