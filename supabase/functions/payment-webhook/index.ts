import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paystack-signature",
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

    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify webhook signature
    if (signature) {
      const hash = createHmac("sha512", PAYSTACK_SECRET_KEY)
        .update(body)
        .digest("hex");

      if (hash !== signature) {
        console.error("Invalid webhook signature");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const event = JSON.parse(body);
    console.log("Webhook event:", event.event);

    // Handle charge success event
    if (event.event === "charge.success") {
      const data = event.data;
      const reference = data.reference;
      const metadata = data.metadata || {};
      const submissionId = metadata.submission_id;
      const paymentType = metadata.payment_type;

      if (!reference) {
        console.error("No reference in webhook data");
        return new Response(
          JSON.stringify({ error: "No reference" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update payment record
      const { error: paymentUpdateError } = await supabase
        .from("payments")
        .update({
          status: "successful",
          paid_at: new Date().toISOString(),
          payment_channel: data.channel || "paystack",
        })
        .eq("payment_reference", reference);

      if (paymentUpdateError) {
        console.error("Payment update error:", paymentUpdateError);
      }

      // Update submission payment status for participant payments
      if (paymentType === "participant" && submissionId) {
        const { error: subError } = await supabase
          .from("submissions")
          .update({ payment_status: "successful" })
          .eq("id", submissionId);

        if (subError) {
          console.error("Submission update error:", subError);
        }
      }

      console.log(`Payment successful for reference: ${reference}`);
    }

    // Handle failed payment
    if (event.event === "charge.failed") {
      const data = event.data;
      const reference = data.reference;
      const metadata = data.metadata || {};
      const submissionId = metadata.submission_id;

      if (reference) {
        // Update payment record
        await supabase
          .from("payments")
          .update({ status: "failed" })
          .eq("payment_reference", reference);

        // Update submission payment status
        if (submissionId) {
          await supabase
            .from("submissions")
            .update({ payment_status: "failed" })
            .eq("id", submissionId);
        }

        console.log(`Payment failed for reference: ${reference}`);
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
