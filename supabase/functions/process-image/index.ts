import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Preset background colors
const BACKGROUND_COLORS: Record<string, string> = {
  white: "#FFFFFF",
  gray: "#E5E5E5",
  blue: "#1E40AF",
  green: "#166534",
};

interface ProcessRequest {
  submissionId: string;
  backgroundColor?: string; // Key from BACKGROUND_COLORS or hex value
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PHOTOROOM_API_KEY = Deno.env.get("PHOTOROOM_API_KEY");
    if (!PHOTOROOM_API_KEY) {
      throw new Error("PhotoRoom API key not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { submissionId, backgroundColor = "white" }: ProcessRequest = await req.json();

    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: "Submission ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing submission: ${submissionId}`);

    // Get submission with photo path
    const { data: submission, error: subError } = await supabase
      .from("submissions")
      .select("id, photo_url, album_id, participant_id")
      .eq("id", submissionId)
      .single();

    if (subError || !submission) {
      return new Response(
        JSON.stringify({ error: "Submission not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine background color hex
    const bgColorHex = BACKGROUND_COLORS[backgroundColor] || backgroundColor;

    // Generate signed URL to fetch the original image (bucket is private)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("photos")
      .createSignedUrl(submission.photo_url, 300); // 5 min expiry

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Failed to generate signed URL:", signedUrlError);
      return new Response(
        JSON.stringify({ error: "Failed to access original image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Download the original image using signed URL
    console.log(`Fetching original image from signed URL`);
    const imageResponse = await fetch(signedUrlData.signedUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to fetch original image");
    }
    const imageBlob = await imageResponse.blob();

    // Create form data for PhotoRoom API
    const formData = new FormData();
    formData.append("image_file", imageBlob, "photo.jpg");
    formData.append("bg_color", bgColorHex);
    formData.append("format", "jpg");
    formData.append("size", "hd"); // High definition output
    formData.append("crop", "true"); // Auto crop to subject

    // Call PhotoRoom API for background removal
    console.log("Calling PhotoRoom API...");
    const photoRoomResponse = await fetch(
      "https://sdk.photoroom.com/v1/segment",
      {
        method: "POST",
        headers: {
          "x-api-key": PHOTOROOM_API_KEY,
        },
        body: formData,
      }
    );

    if (!photoRoomResponse.ok) {
      const errorText = await photoRoomResponse.text();
      console.error("PhotoRoom API error:", errorText);
      
      // Update submission to indicate processing failed (keep original)
      await supabase
        .from("submissions")
        .update({ 
          background_color: backgroundColor,
          // processed_photo_url stays null, falling back to original
        })
        .eq("id", submissionId);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Image processing failed",
          fallback: true // Indicates we're using original image
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get processed image
    const processedImageBlob = await photoRoomResponse.blob();
    const processedImageBuffer = await processedImageBlob.arrayBuffer();

    // Upload processed image to storage
    const processedFileName = `${submission.album_id}/${submission.participant_id}_processed.jpg`;
    
    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(processedFileName, processedImageBuffer, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload processed image");
    }

    // Get public URL for processed image
    const { data: urlData } = supabase.storage
      .from("photos")
      .getPublicUrl(processedFileName);

    const processedPhotoUrl = urlData.publicUrl;

    // Update submission with processed image URL and background color
    const { error: updateError } = await supabase
      .from("submissions")
      .update({
        processed_photo_url: processedPhotoUrl,
        background_color: backgroundColor,
      })
      .eq("id", submissionId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to update submission");
    }

    console.log(`Successfully processed submission: ${submissionId}`);

    return new Response(
      JSON.stringify({
        success: true,
        processedPhotoUrl,
        backgroundColor,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Process image error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
