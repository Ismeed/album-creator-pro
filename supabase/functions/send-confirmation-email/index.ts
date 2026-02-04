import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  participantName: string;
  albumTitle: string;
  editToken: string;
  submissionId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, participantName, albumTitle, editToken, submissionId }: EmailRequest = await req.json();

    if (!email || !participantName || !albumTitle || !editToken || !submissionId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build edit URL
    const siteUrl = Deno.env.get("SITE_URL") || "https://olexstudio.lovable.app";
    const editUrl = `${siteUrl}/edit-submission/${editToken}`;

    // MVP: Log email content instead of sending
    // TODO: Integrate with Resend for production
    console.log("=".repeat(60));
    console.log("CONFIRMATION EMAIL (MVP - NOT ACTUALLY SENT)");
    console.log("=".repeat(60));
    console.log(`To: ${email}`);
    console.log(`Subject: Your submission to "${albumTitle}" is confirmed!`);
    console.log("-".repeat(60));
    console.log(`
Dear ${participantName},

Thank you for submitting your photo to "${albumTitle}"!

Your submission has been received and is pending review by the organizer.

If you need to make changes to your submission, you can use this link:
${editUrl}

Please note: You can only edit your submission while the album is still open for submissions.

Best regards,
Olex Studio Team
    `.trim());
    console.log("=".repeat(60));
    console.log(`Edit Token: ${editToken}`);
    console.log(`Submission ID: ${submissionId}`);
    console.log("=".repeat(60));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email logged (MVP mode - not actually sent)",
        editUrl,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Email error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
