import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      // Return success anyway to not reveal if email exists
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if organizer exists
    const { data: organizer, error: orgError } = await supabase
      .from("organizers")
      .select("id, full_name")
      .eq("email", normalizedEmail)
      .single();

    if (orgError || !organizer) {
      // Return success anyway to not reveal if email exists
      console.log("Organizer not found for email:", normalizedEmail);
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Invalidate any existing reset tokens for this organizer
    await supabase
      .from("password_reset_tokens")
      .delete()
      .eq("organizer_id", organizer.id);

    // Generate a new reset token
    const { data: tokenData, error: tokenError } = await supabase
      .rpc("generate_password_reset_token");

    if (tokenError || !tokenData) {
      console.error("Failed to generate token:", tokenError);
      throw new Error("Failed to generate reset token");
    }

    const resetToken = tokenData as string;

    // Hash the token for storage
    const { data: hashedToken, error: hashError } = await supabase
      .rpc("hash_token", { token: resetToken });

    if (hashError || !hashedToken) {
      console.error("Failed to hash token:", hashError);
      throw new Error("Failed to hash reset token");
    }

    // Store the hashed token with 1 hour expiry
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    
    const { error: insertError } = await supabase
      .from("password_reset_tokens")
      .insert({
        organizer_id: organizer.id,
        token_hash: hashedToken,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Failed to store token:", insertError);
      throw new Error("Failed to store reset token");
    }

    // Build the reset URL
    const appUrl = "https://olexstudio.lovable.app";
    const resetUrl = `${appUrl}/reset-password/${resetToken}`;

    // Send password reset email using Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Email service not configured");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Olex Studio <noreply@olexstudio.app>",
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
              <h1 style="color: #F97316; margin: 0; font-size: 28px;">OLEX</h1>
            </div>
            
            <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Reset Your Password</h2>
            
            <p>Hi ${organizer.full_name || "there"},</p>
            
            <p>We received a request to reset your password for your Olex Studio account. Click the button below to set a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #F97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour for security reasons.</p>
            
            <p style="color: #6b7280; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              Olex Studio - Create beautiful photo albums for your community
            </p>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error("Failed to send password reset email");
    }

    console.log("Password reset email sent to:", normalizedEmail);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in request-password-reset:", error);
    // Return success anyway to not reveal internal errors
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
