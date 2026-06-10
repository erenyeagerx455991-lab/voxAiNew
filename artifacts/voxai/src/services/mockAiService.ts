const API_BASE = "/api";

export async function mockStreamResponse(
  prompt: string,
  onToken: (token: string) => void,
  onDone: (fullText: string, code: string) => void,
  onError: (err: string) => void
): Promise<void> {
  let fullText = "";

  // ── Phase 1: stream the plan text via SSE ─────────────────────
  try {
    const res = await fetch(`${API_BASE}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok || !res.body) {
      const errText = await res.text();
      return onError(errText || "Failed to reach AI service");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload);
          if (json.error) return onError(json.error);
          if (json.token) {
            fullText += json.token;
            onToken(json.token);
          }
        } catch {
          // skip malformed
        }
      }
    }
  } catch (err) {
    return onError(err instanceof Error ? err.message : "Stream failed");
  }

  // ── Phase 2: generate the website code ────────────────────────
  try {
    const res = await fetch(`${API_BASE}/chat/code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return onError(errText || "Code generation failed");
    }

    const data = (await res.json()) as { code?: string; error?: string };
    if (data.error) return onError(data.error);

    onDone(fullText, data.code ?? "");
  } catch (err) {
    onError(err instanceof Error ? err.message : "Code generation failed");
  }
}
