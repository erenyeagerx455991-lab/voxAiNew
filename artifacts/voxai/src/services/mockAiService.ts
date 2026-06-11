const API_BASE = "/api";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function mockStreamResponse(
  prompt: string,
  onToken: (token: string) => void,
  onDone: (fullText: string, code: string) => void,
  onError: (err: string) => void,
  onStep?: (step: number) => void
): Promise<void> {
  let fullText = "";

  // Step 0 → 1: Understanding → Writing Content
  onStep?.(0);
  await delay(480);
  onStep?.(1);
  await delay(420);

  // Step 2: Building Sections — start streaming plan
  onStep?.(2);

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

  // Step 3: Creating Layout — generate code
  onStep?.(3);

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

    // Step 4: Preparing Preview
    onStep?.(4);
    await delay(350);

    onDone(fullText, data.code ?? "");
  } catch (err) {
    onError(err instanceof Error ? err.message : "Code generation failed");
  }
}
