import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept, origin, x-requested-with",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  const url = new URL(req.url);
  console.log(`[submit-participant] ${req.method} ${url.pathname}`);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
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

    // Parse multipart form data
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
    const email = formData.get("email") as string;
    const departmentOrClass = formData.get("departmentOrClass") as string | null;
    const identifier = formData.get("identifier") as string | null;
    const graduationYear = formData.get("graduationYear") as string | null;
    const role = formData.get("role") as string | null;
    const quote = formData.get("quote") as string | null;
    const cohort = formData.get("cohort") as string | null;
    const photoFile = formData.get("photo") as File | null;
    const customFieldValuesRaw = formData.get("customFieldValues") as string | null;
    
    // Parse custom field values
    let customFieldValues: Record<string, string> | null = null;
    if (customFieldValuesRaw) {
      try {
        customFieldValues = JSON.parse(customFieldValuesRaw);
      } catch {
        // Invalid JSON, ignore
      }
    }

    // Validate required fields
    if (!albumId || !fullName || !email) {
      return new Response(
        JSON.stringify({ error: "Album ID, full name, and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!photoFile) {
      return new Response(
        JSON.stringify({ error: "Photo file is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid email address" }),
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
      .select("id, title, is_locked, is_generated, submission_deadline")
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

    if (album.is_generated) {
      return new Response(
        JSON.stringify({ error: "This album has already been generated and cannot accept new submissions" }),
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
    if (fullName.length < 2 || fullName.length > 100) {
      return new Response(
        JSON.stringify({ error: "Full name must be between 2 and 100 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (email.length > 255) {
      return new Response(
        JSON.stringify({ error: "Email is too long (max 255 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (departmentOrClass && departmentOrClass.length > 100) {
      return new Response(
        JSON.stringify({ error: "Department/Class is too long (max 100 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (quote && quote.length > 200) {
      return new Response(
        JSON.stringify({ error: "Quote is too long (max 200 characters)" }),
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

    // Step 1: Insert participant with email and custom field values
    const { data: participant, error: participantError } = await supabaseAdmin
      .from("participants")
      .insert({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        department_or_class: departmentOrClass?.trim() || null,
        identifier: identifier?.trim() || null,
        graduation_year: graduationYear?.trim() || null,
        role: role || "participant",
        quote: quote?.trim() || null,
        cohort: cohort?.trim() || null,
        custom_field_values: customFieldValues,
      })
      .select()
      .single();

    if (participantError) {
      console.error("Error creating participant:", participantError);
      // Provide specific error messages for known constraint violations
      let errorMessage = "Failed to create participant. Please try again.";
      if (participantError.code === "23514") {
        // Check constraint violation - provide actionable message
        if (participantError.message?.includes("full_name")) {
          errorMessage = "Full name must be between 2 and 100 characters.";
        } else if (participantError.message?.includes("quote")) {
          errorMessage = "Quote is too long (max 200 characters).";
        } else if (participantError.message?.includes("graduation_year")) {
          errorMessage = "Graduation year must be in format YYYY or YYYY/YYYY.";
        } else if (participantError.message?.includes("department")) {
          errorMessage = "Department/Class is too long (max 100 characters).";
        } else {
          errorMessage = "Invalid field value. Please check your inputs.";
        }
      } else if (participantError.code === "23505") {
        errorMessage = "A submission with this information already exists.";
      }
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      await supabaseAdmin.from("participants").delete().eq("id", participant.id);
      return new Response(
        JSON.stringify({ error: "Failed to upload photo" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Generate edit token
    const { data: editTokenData } = await supabaseAdmin.rpc("generate_edit_token");
    const editToken = editTokenData as string;

    // Step 4: Create submission record (payment always successful since payments are disabled)
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from("submissions")
      .insert({
        album_id: albumId,
        participant_id: participant.id,
        photo_url: fileName,
        payment_status: "successful", // Payments disabled for testing
        approval_status: "pending",
        edit_token: editToken,
        is_edited: false,
      })
      .select()
      .single();

    if (submissionError) {
      console.error("Error creating submission:", submissionError);
      await supabaseAdmin.storage.from("photos").remove([fileName]);
      await supabaseAdmin.from("participants").delete().eq("id", participant.id);
      return new Response(
        JSON.stringify({ error: "Failed to create submission" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 5: Send confirmation email with await and error handling
    try {
      const sendEmailUrl = `${supabaseUrl}/functions/v1/send-confirmation-email`;
      const emailResp = await fetch(sendEmailUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          participantName: fullName.trim(),
          albumTitle: album.title,
          editToken: editToken,
          submissionId: submission.id,
        }),
      });
      const emailResult = await emailResp.json();
      console.log("[submit-participant] Confirmation email result:", JSON.stringify(emailResult));
    } catch (emailErr) {
      console.error("[submit-participant] Failed to send confirmation email:", emailErr);
    }

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
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
