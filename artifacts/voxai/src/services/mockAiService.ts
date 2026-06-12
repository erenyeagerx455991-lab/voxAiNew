const API_BASE = "/api";

export async function mockStreamResponse(
  prompt: string,
  onToken: (token: string) => void,
  onDone: (fullText: string, code: string) => void,
  onError: (err: string) => void,
  onStep?: (step: number) => void
): Promise<void> {
  // Start with step 0 — Planner Agent active
  onStep?.(0);

  try {
    const res = await fetch(`${API_BASE}/agents/build`, {
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
    let planText = "";
    let finalCode = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        try {
          const json = JSON.parse(payload);

          if (json.type === "error") {
            return onError(json.error);
          }

          if (json.type === "step") {
            // Map agent step index to UI step
            onStep?.(json.step);
          }

          if (json.type === "token") {
            planText += json.token;
            onToken(json.token);
          }

          if (json.type === "done") {
            finalCode = json.code ?? "";
            // Step 4 = Preparing Preview
            onStep?.(4);
            await new Promise((r) => setTimeout(r, 300));
            onDone(planText || json.plan || "", finalCode);
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
  } catch (err) {
    return onError(err instanceof Error ? err.message : "Multi-agent pipeline failed");
  }
}
