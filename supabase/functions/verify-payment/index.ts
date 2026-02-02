import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting (resets on function cold start)
// For production, consider using Deno KV or Redis
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10; // Max 10 requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour window

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    // Create new window
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return true;
  }

  record.count++;
  return false;
}

function getClientIdentifier(req: Request, reference: string): string {
  // Use combination of IP (if available) and reference for rate limiting
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `${ip}:${reference.slice(0, 8)}`;
}

// Validate reference format to prevent enumeration
function isValidReferenceFormat(reference: string): boolean {
  // Expected format: OLEX-{8chars}-{timestamp}
  // Example: OLEX-a1b2c3d4-1234567890123
  const pattern = /^OLEX-[a-f0-9]{8}-\d{13}$/i;
  return pattern.test(reference);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get("reference");

    if (!reference) {
      return new Response(
        JSON.stringify({ error: "Reference is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate reference format to prevent enumeration attacks
    if (!isValidReferenceFormat(reference)) {
      return new Response(
        JSON.stringify({ error: "Invalid reference format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit
    const clientId = getClientIdentifier(req, reference);
    if (isRateLimited(clientId)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error("Paystack secret key not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Verification failed" // Generic error message
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const txData = paystackData.data;
    const isSuccessful = txData.status === "success";
    const metadata = txData.metadata || {};
    const submissionId = metadata.submission_id;

    if (isSuccessful) {
      // Update payment record
      const { error: paymentError } = await supabase
        .from("payments")
        .update({
          status: "successful",
          paid_at: new Date().toISOString(),
          payment_channel: txData.channel || "paystack",
        })
        .eq("payment_reference", reference);

      if (paymentError) {
        console.error("Payment update error:", paymentError);
      }

      // Update submission if participant payment
      if (submissionId) {
        const { error: subError } = await supabase
          .from("submissions")
          .update({ payment_status: "successful" })
          .eq("id", submissionId);

        if (subError) {
          console.error("Submission update error:", subError);
        }
      }
    }

    // Return minimal response - only essential information
    // Avoid exposing sensitive details like amounts, channels, metadata
    return new Response(
      JSON.stringify({
        success: isSuccessful,
        status: txData.status,
        reference: txData.reference,
        // Only include paidAt for successful transactions
        ...(isSuccessful && { paidAt: txData.paid_at }),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Verify payment error:", error);
    // Generic error message to avoid information disclosure
    return new Response(
      JSON.stringify({ error: "Verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
