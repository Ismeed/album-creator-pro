import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error("Paystack secret key not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const reference = url.searchParams.get("reference");

    if (!reference) {
      return new Response(
        JSON.stringify({ error: "Reference is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
          error: paystackData.message || "Verification failed" 
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

    return new Response(
      JSON.stringify({
        success: isSuccessful,
        status: txData.status,
        amount: txData.amount / 100, // Convert from kobo
        reference: txData.reference,
        paidAt: txData.paid_at,
        channel: txData.channel,
        metadata,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Verify payment error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
