import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ParticipantData {
  albumId: string;
  fullName: string;
  departmentOrClass?: string;
  identifier?: string;
  graduationYear?: string;
  role?: string;
  quote?: string;
  cohort?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client with service role key to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const data: ParticipantData = await req.json();

    // Validate required fields
    if (!data.albumId || !data.fullName) {
      return new Response(
        JSON.stringify({ error: "albumId and fullName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UUID format for albumId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(data.albumId)) {
      return new Response(
        JSON.stringify({ error: "Invalid album ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate album exists and is open for submissions
    const { data: album, error: albumError } = await supabaseAdmin
      .from("albums")
      .select("id, is_locked, submission_deadline")
      .eq("id", data.albumId)
      .single();

    if (albumError || !album) {
      return new Response(
        JSON.stringify({ error: "Album not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (album.is_locked) {
      return new Response(
        JSON.stringify({ error: "This album is locked and no longer accepting submissions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (album.submission_deadline && new Date(album.submission_deadline) < new Date()) {
      return new Response(
        JSON.stringify({ error: "The submission deadline for this album has passed" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate field lengths to prevent abuse
    if (data.fullName.length > 100) {
      return new Response(
        JSON.stringify({ error: "Full name is too long (max 100 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert participant using service role (bypasses RLS)
    const { data: participant, error: participantError } = await supabaseAdmin
      .from("participants")
      .insert({
        full_name: data.fullName.trim(),
        department_or_class: data.departmentOrClass?.trim() || null,
        identifier: data.identifier?.trim() || null,
        graduation_year: data.graduationYear?.trim() || null,
        role: data.role || "participant",
        quote: data.quote?.trim() || null,
        cohort: data.cohort?.trim() || null,
      })
      .select()
      .single();

    if (participantError) {
      console.error("Error creating participant:", participantError);
      return new Response(
        JSON.stringify({ error: "Failed to create participant" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ participant }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
