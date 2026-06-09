import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CREDIT_COSTS: Record<string, number> = {
  chat: 1,
  tts: 2,
  voice_clone: 10,
};

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
      const { feature, referenceId } = await req.json();

      if (!feature || !CREDIT_COSTS[feature]) {
        return new Response(JSON.stringify({ error: "Valid feature is required (chat, tts, voice_clone)" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Deduct credits via SECURITY DEFINER function (no service role needed)
      const deductRes = await fetch(`${supabaseUrl}/rest/v1/rpc/deduct_credits`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          p_user_id: userId,
          p_amount: CREDIT_COSTS[feature],
          p_feature: feature,
          p_reference_id: referenceId || null,
        }),
      });
      const deductResult = await deductRes.json();

      if (!deductResult.success) {
        return new Response(JSON.stringify({ error: deductResult.error || "Credit deduction failed", credits: deductResult.credits, success: false }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ credits: deductResult.credits, success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      // Get current credits and usage (RLS filters to own records)
      const creditsRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_user_credits`, {
        method: "POST",
        headers,
        body: JSON.stringify({ p_user_id: userId }),
      });
      const creditsData = await creditsRes.json();

      const usageRes = await fetch(
        `${supabaseUrl}/rest/v1/credit_usage?order=created_at.desc&limit=50`,
        { headers }
      );
      const usage = await usageRes.json();

      return new Response(
        JSON.stringify({
          credits: creditsData.credits ?? 0,
          usage,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
