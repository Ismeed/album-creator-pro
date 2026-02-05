import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface OrganizerProfile {
  id: string;
  email: string;
  full_name: string;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
}

export function useOrganizerProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["organizer-profile", user?.id],
    queryFn: async (): Promise<OrganizerProfile | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("organizers")
        .select("id, email, full_name, is_verified, verified_at, created_at")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Failed to fetch organizer profile:", error);
        return null;
      }

      return data as OrganizerProfile;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

export function useResendVerificationEmail() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.email) throw new Error("No email found");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !apiKey) {
        throw new Error("Configuration error");
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/resend-verification-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify({ email: user.email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send email");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizer-profile"] });
    },
  });
}
