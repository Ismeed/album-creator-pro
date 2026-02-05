import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find organizer by email
    const { data: organizer, error: findError } = await supabaseAdmin
      .from("organizers")
      .select("id, email, full_name, is_verified, verification_token")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (findError || !organizer) {
      // Don't reveal if email exists
      return new Response(
        JSON.stringify({ success: true, message: "If this email exists, a verification link has been sent." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (organizer.is_verified) {
      return new Response(
        JSON.stringify({ error: "Email already verified" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate new verification token if none exists
    let verificationToken = organizer.verification_token;
    if (!verificationToken) {
      const { data: tokenData } = await supabaseAdmin.rpc("generate_verification_token");
      verificationToken = tokenData as string;

      await supabaseAdmin
        .from("organizers")
        .update({ verification_token: verificationToken })
        .eq("id", organizer.id);
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://olexstudio.lovable.app";
    const verifyUrl = `${siteUrl}/verify-email?token=${verificationToken}`;

    console.log(`Resending verification email to: ${email}`);

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
  
  <h2 style="color: #1a1a1a; margin-bottom: 20px;">Hi ${organizer.full_name},</h2>
  
  <p>Here's your verification link. Click below to verify your email address.</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${verifyUrl}" style="display: inline-block; background-color: #E53E3E; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify Email Address</a>
  </div>
  
  <p style="color: #666; font-size: 14px;">Or copy this link into your browser:</p>
  <p style="word-break: break-all; background: #f5f5f5; padding: 12px; border-radius: 6px; font-size: 13px;">${verifyUrl}</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px; text-align: center;">
    If you didn't request this, you can safely ignore this email.
  </p>
</body>
</html>`.trim();

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Olex Studio <noreply@olexstudio.app>",
        to: [email],
        subject: "✅ Verify your Olex Studio account",
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Email API error: ${emailResponse.status}`);
    }

    console.log("Verification email resent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Verification email sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Resend verification error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send verification email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
