import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Mock voice cloning provider — ready for future integration
interface VoiceCloneProvider {
  name: string;
  processVoice(modelId: string, sampleUrl: string): Promise<{ status: string }>;
}

const mockVoiceProvider: VoiceCloneProvider = {
  name: "mock-voice-clone",
  async processVoice(_modelId: string, _sampleUrl: string): Promise<{ status: string }> {
    await new Promise((r) => setTimeout(r, 1000));
    return { status: "completed" };
  },
};

const activeVoiceProvider: VoiceCloneProvider = mockVoiceProvider;

function userHeaders(userToken: string, anonKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${userToken}`,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userToken = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const headers = userHeaders(userToken, anonKey);
    const userId = extractUserId(userToken);

    if (!userId) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { voiceModelId, action } = body;

      if (action === "process" && voiceModelId) {
        // Update status to processing (RLS allows update of own models)
        await fetch(`${supabaseUrl}/rest/v1/voice_models?id=eq.${voiceModelId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: "processing" }),
        });

        // Get voice model details (RLS allows select of own models)
        const modelRes = await fetch(
          `${supabaseUrl}/rest/v1/voice_models?id=eq.${voiceModelId}&select=*`,
          { headers }
        );
        const models = await modelRes.json();
        const model = models[0];

        // Process voice via provider
        const result = await activeVoiceProvider.processVoice(
          voiceModelId,
          model?.sample_audio_url || ""
        );

        // Update status
        await fetch(`${supabaseUrl}/rest/v1/voice_models?id=eq.${voiceModelId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: result.status }),
        });

        // Deduct credits via SECURITY DEFINER function
        const deductRes = await fetch(`${supabaseUrl}/rest/v1/rpc/deduct_credits`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            p_user_id: userId,
            p_amount: 10,
            p_feature: "voice_clone",
            p_reference_id: voiceModelId,
          }),
        });
        const deductResult = await deductRes.json();

        return new Response(JSON.stringify({ id: voiceModelId, status: result.status, credits: deductResult.credits }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create new voice model (RLS allows insert with own user_id)
      const { voiceName, description, sampleAudioUrl } = body;
      if (!voiceName) {
        return new Response(JSON.stringify({ error: "voiceName is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const createRes = await fetch(`${supabaseUrl}/rest/v1/voice_models`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({
          user_id: userId,
          voice_name: voiceName,
          description: description || "",
          sample_audio_url: sampleAudioUrl || "",
          status: "pending",
        }),
      });

      const created = await createRes.json();

      return new Response(JSON.stringify(created[0] || created), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      // Get user's voice models (RLS filters to own records)
      const modelsRes = await fetch(
        `${supabaseUrl}/rest/v1/voice_models?order=created_at.desc`,
        { headers }
      );
      const models = await modelsRes.json();

      return new Response(JSON.stringify(models), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "DELETE") {
      const { id } = await req.json();
      if (!id) {
        return new Response(JSON.stringify({ error: "id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // RLS allows delete of own models
      await fetch(`${supabaseUrl}/rest/v1/voice_models?id=eq.${id}`, {
        method: "DELETE",
        headers,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function extractUserId(token: string): string {
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      return payload.sub || "";
    }
  } catch {
    // fallback
  }
  return "";
}
