import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const { email, participantName, albumTitle, editToken, submissionId }: EmailRequest = await req.json();

    if (!email || !participantName || !albumTitle || !editToken || !submissionId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://olexstudio.lovable.app";
    const editUrl = `${siteUrl}/edit-submission/${editToken}`;

    // If Resend is not configured, log the email (fallback for development)
    if (!resendApiKey) {
      console.log("=".repeat(60));
      console.log("CONFIRMATION EMAIL (Resend not configured)");
      console.log("=".repeat(60));
      console.log(`To: ${email}`);
      console.log(`Subject: ✅ Olex Studio – Submission Successful`);
      console.log(`Edit URL: ${editUrl}`);
      console.log("=".repeat(60));

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email logged (Resend not configured)",
          editUrl,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    console.log(`Sending confirmation email to: ${email}`);

    const emailResponse = await resend.emails.send({
      from: "Olex Studio <noreply@olexstudio.app>",
      to: [email],
      subject: "✅ Olex Studio – Submission Successful",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #E53E3E; margin: 0; font-size: 28px;">OLEX</h1>
    <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Photo Album Studio</p>
  </div>
  
  <h2 style="color: #1a1a1a; margin-bottom: 20px;">Hi ${participantName},</h2>
  
  <p>Your submission to <strong>"${albumTitle}"</strong> was successful! 🎉</p>
  
  <p>You can edit your response using the link below:</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${editUrl}" style="display: inline-block; background-color: #E53E3E; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Edit Your Submission</a>
  </div>
  
  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0 0 8px 0; font-weight: 600; color: #1a1a1a;">📝 Note:</p>
    <ul style="margin: 0; padding-left: 20px; color: #666;">
      <li>Editing is available only before the submission deadline</li>
      <li>Editing will be disabled once the album is generated</li>
    </ul>
  </div>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px; text-align: center;">
    — Olex Studio
  </p>
</body>
</html>
      `.trim(),
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Confirmation email sent",
        editUrl,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Email error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
