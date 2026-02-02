import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  console.log("Request received:", req.method, req.url);
  
  // Handle CORS preflight - must return 204 with headers
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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

    // Parse multipart form data - ensure content type is multipart/form-data
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response(
        JSON.stringify({ error: "Content-Type must be multipart/form-data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formData = await req.formData();
    
    const albumId = formData.get("albumId") as string;
    const fullName = formData.get("fullName") as string;
    const departmentOrClass = formData.get("departmentOrClass") as string | null;
    const identifier = formData.get("identifier") as string | null;
    const graduationYear = formData.get("graduationYear") as string | null;
    const role = formData.get("role") as string | null;
    const quote = formData.get("quote") as string | null;
    const cohort = formData.get("cohort") as string | null;
    const backgroundColor = formData.get("backgroundColor") as string || "white";
    const paymentMode = formData.get("paymentMode") as string || "organizer_pays";
    const photoFile = formData.get("photo") as File | null;

    // Validate required fields
    if (!albumId || !fullName) {
      return new Response(
        JSON.stringify({ error: "albumId and fullName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!photoFile) {
      return new Response(
        JSON.stringify({ error: "Photo file is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UUID format for albumId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(albumId)) {
      return new Response(
        JSON.stringify({ error: "Invalid album ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate album exists and is open for submissions
    const { data: album, error: albumError } = await supabaseAdmin
      .from("albums")
      .select("id, is_locked, submission_deadline")
      .eq("id", albumId)
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

    // Check for duplicate submission by name
    const { data: existingSubmissions } = await supabaseAdmin
      .from("submissions")
      .select(`id, participant:participants!inner(full_name)`)
      .eq("album_id", albumId);

    const duplicate = existingSubmissions?.find(
      (sub: any) => sub.participant?.full_name?.toLowerCase() === fullName.toLowerCase().trim()
    );

    if (duplicate) {
      return new Response(
        JSON.stringify({ error: "You have already submitted a photo for this album." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate field lengths
    if (fullName.length > 100) {
      return new Response(
        JSON.stringify({ error: "Full name is too long (max 100 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file size (10MB max)
    if (photoFile.size > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "Photo file is too large (max 10MB)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(photoFile.type)) {
      return new Response(
        JSON.stringify({ error: "Invalid file type. Only JPG and PNG are allowed." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Insert participant
    const { data: participant, error: participantError } = await supabaseAdmin
      .from("participants")
      .insert({
        full_name: fullName.trim(),
        department_or_class: departmentOrClass?.trim() || null,
        identifier: identifier?.trim() || null,
        graduation_year: graduationYear?.trim() || null,
        role: role || "participant",
        quote: quote?.trim() || null,
        cohort: cohort?.trim() || null,
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

    // Step 2: Upload photo to storage
    const fileExt = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${albumId}/${participant.id}.${fileExt}`;
    const fileBuffer = await photoFile.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from("photos")
      .upload(fileName, fileBuffer, {
        contentType: photoFile.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading photo:", uploadError);
      // Clean up participant
      await supabaseAdmin.from("participants").delete().eq("id", participant.id);
      return new Response(
        JSON.stringify({ error: "Failed to upload photo" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Create submission record
    const paymentStatus = paymentMode === "organizer_pays" ? "successful" : "pending";

    const { data: submission, error: submissionError } = await supabaseAdmin
      .from("submissions")
      .insert({
        album_id: albumId,
        participant_id: participant.id,
        photo_url: fileName,
        payment_status: paymentStatus,
        approval_status: "pending",
        background_color: backgroundColor,
      })
      .select()
      .single();

    if (submissionError) {
      console.error("Error creating submission:", submissionError);
      // Clean up photo and participant
      await supabaseAdmin.storage.from("photos").remove([fileName]);
      await supabaseAdmin.from("participants").delete().eq("id", participant.id);
      return new Response(
        JSON.stringify({ error: "Failed to create submission" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 4: Trigger image processing (fire and forget)
    const processImageUrl = `${supabaseUrl}/functions/v1/process-image`;
    fetch(processImageUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        submissionId: submission.id,
        backgroundColor: backgroundColor,
      }),
    }).catch((err) => console.error("Image processing trigger failed:", err));

    return new Response(
      JSON.stringify({
        success: true,
        participantId: participant.id,
        submissionId: submission.id,
        photoUrl: fileName,
      }),
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
