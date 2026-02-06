import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  fullName: string;
  verificationToken: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("[send-verification-email] RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    console.log("[send-verification-email] Request body:", JSON.stringify({ email: body.email, fullName: body.fullName, hasToken: !!body.verificationToken }));

    const { email, fullName, verificationToken }: VerificationEmailRequest = body;

    if (!email || !fullName || !verificationToken) {
      console.error("[send-verification-email] Missing required fields:", { email: !!email, fullName: !!fullName, verificationToken: !!verificationToken });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://olexstudio.lovable.app";
    const verifyUrl = `${siteUrl}/verify-email?token=${verificationToken}`;

    console.log(`[send-verification-email] Preparing email to: ${email}, verify URL: ${verifyUrl}`);

    const emailHtml = `
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
  
  <h2 style="color: #1a1a1a; margin-bottom: 20px;">Hi ${fullName},</h2>
  
  <p>Welcome to Olex Studio! Please verify your email address to start creating beautiful photo albums.</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${verifyUrl}" style="display: inline-block; background-color: #E53E3E; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify Email Address</a>
  </div>
  
  <p style="color: #666; font-size: 14px;">Or copy this link into your browser:</p>
  <p style="word-break: break-all; background: #f5f5f5; padding: 12px; border-radius: 6px; font-size: 13px;">${verifyUrl}</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px; text-align: center;">
    If you didn't create an account with Olex Studio, you can safely ignore this email.
  </p>
</body>
</html>`.trim();

    // Use Resend onboarding sender for sandbox mode, or verified domain
    const fromAddress = "Olex Studio <onboarding@resend.dev>";

    console.log(`[send-verification-email] Sending via Resend from: ${fromAddress}`);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject: "✅ Verify your Olex Studio account",
        html: emailHtml,
      }),
    });

    const responseText = await emailResponse.text();
    console.log(`[send-verification-email] Resend API response (${emailResponse.status}):`, responseText);

    if (!emailResponse.ok) {
      console.error("[send-verification-email] Resend API error:", responseText);
      throw new Error(`Email API error: ${emailResponse.status} - ${responseText}`);
    }

    const result = JSON.parse(responseText);
    console.log(`[send-verification-email] SUCCESS - Email ID: ${result.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification email sent",
        emailId: result.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[send-verification-email] Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send verification email", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
