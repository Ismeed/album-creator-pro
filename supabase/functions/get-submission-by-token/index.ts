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

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get edit token from query params
    const url = new URL(req.url);
    const editToken = url.searchParams.get("token");

    if (!editToken) {
      return new Response(
        JSON.stringify({ error: "Edit token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find submission by edit token
    const { data: submission, error: subError } = await supabaseAdmin
      .from("submissions")
      .select(`
        id,
        album_id,
        photo_url,
        processed_photo_url,
        background_color,
        is_edited,
        approval_status,
        submitted_at,
        participant:participants!inner(
          id,
          full_name,
          email,
          department_or_class,
          identifier,
          graduation_year,
          role,
          quote,
          cohort
        )
      `)
      .eq("edit_token", editToken)
      .single();

    if (subError || !submission) {
      return new Response(
        JSON.stringify({ error: "Submission not found. The edit link may be invalid or expired." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get album details to check if editable
    const { data: album, error: albumError } = await supabaseAdmin
      .from("albums")
      .select("id, title, is_locked, is_generated, submission_deadline")
      .eq("id", submission.album_id)
      .single();

    if (albumError || !album) {
      return new Response(
        JSON.stringify({ error: "Album not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if submission is editable
    const now = new Date();
    const deadlinePassed = album.submission_deadline && new Date(album.submission_deadline) < now;
    const isEditable = !album.is_locked && !album.is_generated && !deadlinePassed;

    let editDisabledReason = null;
    if (album.is_locked) {
      editDisabledReason = "The album has been locked by the organizer.";
    } else if (album.is_generated) {
      editDisabledReason = "The album has already been generated.";
    } else if (deadlinePassed) {
      editDisabledReason = "The submission deadline has passed.";
    }

    // Generate signed URL for photo
    let photoSignedUrl = null;
    const photoPath = submission.processed_photo_url || submission.photo_url;
    if (photoPath) {
      const { data: signedData } = await supabaseAdmin.storage
        .from("photos")
        .createSignedUrl(photoPath, 3600); // 1 hour
      photoSignedUrl = signedData?.signedUrl || null;
    }

    return new Response(
      JSON.stringify({
        success: true,
        submission: {
          id: submission.id,
          albumId: submission.album_id,
          photoUrl: photoSignedUrl,
          backgroundColor: submission.background_color,
          isEdited: submission.is_edited,
          approvalStatus: submission.approval_status,
          submittedAt: submission.submitted_at,
          participant: submission.participant,
        },
        album: {
          id: album.id,
          title: album.title,
        },
        isEditable,
        editDisabledReason,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
