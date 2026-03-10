import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FROM_ADDRESS = "Olex <no-reply@olexstudio.com>";

interface PasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: organizer, error: orgError } = await supabase
      .from("organizers")
      .select("id, full_name")
      .eq("email", normalizedEmail)
      .single();

    if (orgError || !organizer) {
      console.log("[request-password-reset] Organizer not found for email:", normalizedEmail);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Invalidate existing reset tokens
    await supabase
      .from("password_reset_tokens")
      .delete()
      .eq("organizer_id", organizer.id);

    const { data: tokenData, error: tokenError } = await supabase
      .rpc("generate_password_reset_token");

    if (tokenError || !tokenData) {
      console.error("[request-password-reset] Failed to generate token:", tokenError);
      throw new Error("Failed to generate reset token");
    }

    const resetToken = tokenData as string;

    const { data: hashedToken, error: hashError } = await supabase
      .rpc("hash_token", { token: resetToken });

    if (hashError || !hashedToken) {
      console.error("[request-password-reset] Failed to hash token:", hashError);
      throw new Error("Failed to hash reset token");
    }

    // 15-minute expiry
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    const { error: insertError } = await supabase
      .from("password_reset_tokens")
      .insert({
        organizer_id: organizer.id,
        token_hash: hashedToken,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("[request-password-reset] Failed to store token:", insertError);
      throw new Error("Failed to store reset token");
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://olexstudio.com";
    const resetUrl = `${siteUrl}/reset-password/${resetToken}`;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("[request-password-reset] RESEND_API_KEY not configured");
      throw new Error("Email service not configured");
    }

    console.log(`[request-password-reset] Sending reset email to: ${normalizedEmail}`);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [normalizedEmail],
        subject: "Reset your Olex Studio password",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #E53E3E; margin: 0; font-size: 28px;">OLEX</h1>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Photo Album Studio</p>
            </div>
            
            <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Reset Your Password</h2>
            
            <p>Hi ${organizer.full_name || "there"},</p>
            
            <p>We received a request to reset your password for your Olex Studio account. Click the button below to set a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #E53E3E; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 15 minutes for security reasons.</p>
            
            <p style="color: #6b7280; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              — Olex Studio
            </p>
          </body>
          </html>
        `,
      }),
    });

    const responseText = await emailResponse.text();
    console.log(`[request-password-reset] Resend API response (${emailResponse.status}):`, responseText);

    if (!emailResponse.ok) {
      console.error("[request-password-reset] Resend API error:", responseText);
      throw new Error("Failed to send password reset email");
    }

    const result = JSON.parse(responseText);
    console.log(`[request-password-reset] SUCCESS - Email ID: ${result.id}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("[request-password-reset] Error:", error);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
