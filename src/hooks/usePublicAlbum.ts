import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Json } from "@/integrations/supabase/types";

// Type for the public album info returned by the secure RPC function
// This intentionally excludes organizer_id to prevent identity tracking
export type PublicAlbum = {
  id: string;
  title: string;
  institution_name: string | null;
  album_type: Database["public"]["Enums"]["album_type"];
  submission_deadline: string | null;
  is_locked: boolean;
  payment_mode: Database["public"]["Enums"]["payment_mode"];
  price_per_participant: number | null;
  required_fields: Json | null;
  template_id?: string;
  custom_fields?: Json | null;
};

export function usePublicAlbum(albumId: string | undefined) {
  return useQuery({
    queryKey: ["public-album", albumId],
    queryFn: async (): Promise<PublicAlbum | null> => {
      if (!albumId) return null;

      // Use the secure RPC function that doesn't expose organizer_id
      const { data, error } = await supabase
        .rpc("get_public_album_info", { _album_id: albumId });

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Not found
        }
        throw error;
      }

      // RPC returns an array, get the first (and only) result
      if (!data || data.length === 0) {
        return null;
      }

      return data[0] as PublicAlbum;
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
