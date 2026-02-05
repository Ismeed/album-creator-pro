import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, newPassword }: ResetPasswordRequest = await req.json();

    // Validate inputs
    if (!token || typeof token !== "string" || token.length !== 64) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!newPassword || newPassword.length < 8) {
      return new Response(
        JSON.stringify({ success: false, error: "Password must be at least 8 characters" }),
        {
          status: 400,
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
        JSON.stringify({ success: false, error: "Token validation failed" }),
        {
          status: 400,
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
        JSON.stringify({ success: false, error: "Invalid or expired reset link" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if token has been used
    if (resetToken.used_at) {
      console.log("Token already used");
      return new Response(
        JSON.stringify({ success: false, error: "This reset link has already been used" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if token has expired
    const expiresAt = new Date(resetToken.expires_at);
    if (expiresAt < new Date()) {
      console.log("Token expired");
      return new Response(
        JSON.stringify({ success: false, error: "This reset link has expired" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get the organizer's auth user ID (same as organizer.id)
    const organizerId = resetToken.organizer_id;

    // Update the user's password using the admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      organizerId,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Failed to update password:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to update password. Please try again." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Mark the token as used
    const { error: markUsedError } = await supabase
      .from("password_reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", resetToken.id);

    if (markUsedError) {
      console.error("Failed to mark token as used:", markUsedError);
      // Don't return error since password was updated successfully
    }

    // Delete all reset tokens for this organizer (cleanup)
    await supabase
      .from("password_reset_tokens")
      .delete()
      .eq("organizer_id", organizerId);

    console.log("Password reset successful for organizer:", organizerId);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in reset-password:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An unexpected error occurred. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
