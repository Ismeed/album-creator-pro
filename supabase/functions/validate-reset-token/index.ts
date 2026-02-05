import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ValidateTokenRequest {
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token }: ValidateTokenRequest = await req.json();

    if (!token || typeof token !== "string" || token.length !== 64) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid token format" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Hash the provided token
    const { data: hashedToken, error: hashError } = await supabase
      .rpc("hash_token", { token });

    if (hashError || !hashedToken) {
      console.error("Failed to hash token:", hashError);
      return new Response(
        JSON.stringify({ valid: false, error: "Token validation failed" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Look up the token
    const { data: resetToken, error: lookupError } = await supabase
      .from("password_reset_tokens")
      .select("id, organizer_id, expires_at, used_at")
      .eq("token_hash", hashedToken)
      .single();

    if (lookupError || !resetToken) {
      console.log("Token not found");
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid or expired reset link" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if token has been used
    if (resetToken.used_at) {
      console.log("Token already used");
      return new Response(
        JSON.stringify({ valid: false, error: "This reset link has already been used" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if token has expired
    const expiresAt = new Date(resetToken.expires_at);
    if (expiresAt < new Date()) {
      console.log("Token expired");
      return new Response(
        JSON.stringify({ valid: false, error: "This reset link has expired" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ valid: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in validate-reset-token:", error);
    return new Response(
      JSON.stringify({ valid: false, error: "Token validation failed" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
