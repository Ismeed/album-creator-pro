import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { Json } from "@/integrations/supabase/types";

export type PublicAlbum = Pick<
  Tables<"albums">,
  "id" | "title" | "institution_name" | "album_type" | "submission_deadline" | "is_locked" | "payment_mode" | "price_per_participant"
> & {
  required_fields: Json | null;
};

export function usePublicAlbum(albumId: string | undefined) {
  return useQuery({
    queryKey: ["public-album", albumId],
    queryFn: async (): Promise<PublicAlbum | null> => {
      if (!albumId) return null;

      const { data, error } = await supabase
        .from("albums")
        .select("id, title, institution_name, album_type, submission_deadline, is_locked, payment_mode, price_per_participant, required_fields")
        .eq("id", albumId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Not found
        }
        throw error;
      }

      return data;
    },
    enabled: !!albumId,
    retry: false,
  });
}

export function useAlbumStatus(album: PublicAlbum | null | undefined) {
  if (!album) {
    return {
      isOpen: false,
      reason: "not_found" as const,
      message: "Album not found",
    };
  }

  if (album.is_locked) {
    return {
      isOpen: false,
      reason: "locked" as const,
      message: "Submissions are closed for this album.",
    };
  }

  if (album.submission_deadline) {
    const deadline = new Date(album.submission_deadline);
    if (deadline < new Date()) {
      return {
        isOpen: false,
        reason: "deadline_passed" as const,
        message: `The submission deadline (${deadline.toLocaleDateString()}) has passed.`,
      };
    }
  }

  return {
    isOpen: true,
    reason: "open" as const,
    message: "Accepting submissions",
  };
}
