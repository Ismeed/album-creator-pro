import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
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

    const body = await req.json();
    const { 
      editToken, 
      fullName, 
      email, 
      departmentOrClass, 
      identifier, 
      graduationYear, 
      role, 
      quote, 
      cohort 
    } = body;

    if (!editToken) {
      return new Response(
        JSON.stringify({ error: "Edit token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!fullName || !email) {
      return new Response(
        JSON.stringify({ error: "Full name and email are required" }),
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

    // Find submission by edit token
    const { data: submission, error: subError } = await supabaseAdmin
      .from("submissions")
      .select("id, album_id, participant_id")
      .eq("edit_token", editToken)
      .single();

    if (subError || !submission) {
      return new Response(
        JSON.stringify({ error: "Submission not found. The edit link may be invalid." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if submission is editable using the database function
    const { data: isEditable } = await supabaseAdmin.rpc("is_submission_editable", {
      _submission_id: submission.id,
    });

    if (!isEditable) {
      return new Response(
        JSON.stringify({ error: "Editing is no longer available for this album." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update participant details
    const { error: updateParticipantError } = await supabaseAdmin
      .from("participants")
      .update({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        department_or_class: departmentOrClass?.trim() || null,
        identifier: identifier?.trim() || null,
        graduation_year: graduationYear?.trim() || null,
        role: role || "participant",
        quote: quote?.trim() || null,
        cohort: cohort?.trim() || null,
      })
      .eq("id", submission.participant_id);

    if (updateParticipantError) {
      console.error("Error updating participant:", updateParticipantError);
      return new Response(
        JSON.stringify({ error: "Failed to update your details. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark submission as edited
    const { error: updateSubmissionError } = await supabaseAdmin
      .from("submissions")
      .update({ 
        is_edited: true,
        // Reset approval status to pending if it was approved
        approval_status: "pending",
      })
      .eq("id", submission.id);

    if (updateSubmissionError) {
      console.error("Error marking submission as edited:", updateSubmissionError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Your submission has been updated successfully." 
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
