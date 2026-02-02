import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface InitializePaymentParams {
  submissionId: string;
  email: string;
  callbackUrl: string;
}

interface PaymentInitResult {
  success: boolean;
  authorization_url: string;
  reference: string;
  access_code: string;
}

interface VerifyPaymentResult {
  success: boolean;
  status: string;
  amount: number;
  reference: string;
  paidAt: string;
  channel: string;
  metadata: {
    submission_id?: string;
    album_id?: string;
    album_title?: string;
    payment_type?: string;
  };
}

export function useInitializePayment() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const mutation = useMutation({
    mutationFn: async (params: InitializePaymentParams): Promise<PaymentInitResult> => {
      const { data, error } = await supabase.functions.invoke("initialize-payment", {
        body: params,
      });

      if (error) {
        throw new Error(error.message || "Failed to initialize payment");
      }

      if (!data.success) {
        throw new Error(data.error || "Payment initialization failed");
      }

      return data;
    },
    onSuccess: (data) => {
      // Redirect to Paystack checkout
      if (data.authorization_url) {
        setIsRedirecting(true);
        window.location.href = data.authorization_url;
      }
    },
  });

  return {
    ...mutation,
    isRedirecting,
  };
}

export function useVerifyPayment(reference: string | null) {
  return useQuery({
    queryKey: ["verify-payment", reference],
    queryFn: async (): Promise<VerifyPaymentResult> => {
      if (!reference) {
        throw new Error("No reference provided");
      }

      const { data, error } = await supabase.functions.invoke("verify-payment", {
        body: {},
        headers: {},
      });

      // The verify-payment function uses query params, so we need to call it differently
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment?reference=${encodeURIComponent(reference)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Verification failed");
      }

      return response.json();
    },
    enabled: !!reference,
    retry: 2,
    staleTime: 30000, // Cache for 30 seconds
  });
}

export function useSubmissionPaymentStatus(submissionId: string | null) {
  return useQuery({
    queryKey: ["submission-payment-status", submissionId],
    queryFn: async () => {
      if (!submissionId) return null;

      const { data, error } = await supabase
        .from("submissions")
        .select("payment_status")
        .eq("id", submissionId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!submissionId,
    refetchInterval: 5000, // Poll every 5 seconds while on payment page
  });
}
