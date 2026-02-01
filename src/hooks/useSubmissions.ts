import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Submission = Tables<"submissions">;
export type Participant = Tables<"participants">;

export interface SubmissionWithParticipant extends Submission {
  participant: Participant | null;
}

export function useAlbumSubmissions(albumId: string | undefined) {
  const queryClient = useQueryClient();

  // Set up real-time subscription
  useEffect(() => {
    if (!albumId) return;

    const channel = supabase
      .channel(`submissions-${albumId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `album_id=eq.${albumId}`,
        },
        () => {
          // Invalidate and refetch on any change
          queryClient.invalidateQueries({ queryKey: ["submissions", albumId] });
          queryClient.invalidateQueries({ queryKey: ["albums"] });
          queryClient.invalidateQueries({ queryKey: ["album", albumId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [albumId, queryClient]);

  return useQuery({
    queryKey: ["submissions", albumId],
    queryFn: async (): Promise<SubmissionWithParticipant[]> => {
      if (!albumId) return [];

      const { data, error } = await supabase
        .from("submissions")
        .select(`
          *,
          participant:participants(*)
        `)
        .eq("album_id", albumId)
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      return data.map((item) => ({
        ...item,
        participant: item.participant as Participant | null,
      }));
    },
    enabled: !!albumId,
  });
}

export function useUpdateSubmissionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      approvalStatus,
    }: {
      submissionId: string;
      approvalStatus: "pending" | "approved" | "rejected";
    }) => {
      const { data, error } = await supabase
        .from("submissions")
        .update({ approval_status: approvalStatus })
        .eq("id", submissionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["submissions", data.album_id] });
      queryClient.invalidateQueries({ queryKey: ["album", data.album_id] });
    },
  });
}

export function useDeleteSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ submissionId, albumId }: { submissionId: string; albumId: string }) => {
      const { error } = await supabase
        .from("submissions")
        .delete()
        .eq("id", submissionId);

      if (error) throw error;
      return { albumId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["submissions", data.albumId] });
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      queryClient.invalidateQueries({ queryKey: ["album", data.albumId] });
    },
  });
}
