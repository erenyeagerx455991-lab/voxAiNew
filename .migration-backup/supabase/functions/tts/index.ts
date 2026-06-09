import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function userHeaders(userToken: string, anonKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${userToken}`,
  };
}

function extractUserId(token: string): string {
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      return payload.sub || "";
    }
  } catch {}
  return "";
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
      const { text, voiceName } = await req.json();

      if (!text || !voiceName) {
        return new Response(JSON.stringify({ error: "text and voiceName are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Browser TTS is handled entirely client-side using Web Speech API
      // This endpoint just logs the TTS usage to the database for tracking

      // Log TTS usage (optional - for analytics)
      try {
        await fetch(`${supabaseUrl}/rest/v1/tts_history`, {
          method: "POST",
          headers: { ...headers, Prefer: "return=representation" },
          body: JSON.stringify({
            user_id: userId,
            text,
            voice_name: voiceName,
            audio_url: "",
            duration_seconds: 0,
          }),
        });
      } catch {}

      // Return success - audio generation happens in browser
      const response = {
        id: crypto.randomUUID(),
        user_id: userId,
        text,
        voice_name: voiceName,
        audio_url: "",
        duration_seconds: 0,
        created_at: new Date().toISOString(),
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
