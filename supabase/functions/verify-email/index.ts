import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Verification token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate token format (64 character hex string)
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return new Response(
        JSON.stringify({ error: "Invalid verification token format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find organizer by verification token
    const { data: organizer, error: findError } = await supabaseAdmin
      .from("organizers")
      .select("id, email, full_name, is_verified")
      .eq("verification_token", token)
      .single();

    if (findError || !organizer) {
      console.error("Organizer not found:", findError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired verification link" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (organizer.is_verified) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email already verified",
          alreadyVerified: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update organizer as verified
    const { error: updateError } = await supabaseAdmin
      .from("organizers")
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        verification_token: null, // Clear token after use
      })
      .eq("id", organizer.id);

    if (updateError) {
      console.error("Failed to verify organizer:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to verify email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Email verified for organizer: ${organizer.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email verified successfully",
        organizerName: organizer.full_name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify({ error: "Verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
