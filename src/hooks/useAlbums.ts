import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Album = Tables<"albums">;
export type AlbumInsert = TablesInsert<"albums">;
export type AlbumUpdate = TablesUpdate<"albums">;

export interface AlbumWithStats extends Album {
  submission_count: number;
}

export function useAlbums() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["albums", user?.id],
    queryFn: async (): Promise<AlbumWithStats[]> => {
      if (!user) throw new Error("Not authenticated");

      // Get albums with submission counts
      const { data: albums, error } = await supabase
        .from("albums")
        .select("*")
        .eq("organizer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get submission counts for each album
      const albumsWithStats = await Promise.all(
        albums.map(async (album) => {
          const { count, error: countError } = await supabase
            .from("submissions")
            .select("*", { count: "exact", head: true })
            .eq("album_id", album.id);

          return {
            ...album,
            submission_count: countError ? 0 : (count || 0),
          };
        })
      );

      return albumsWithStats;
    },
    enabled: !!user,
  });
}

export function useAlbum(albumId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["album", albumId],
    queryFn: async (): Promise<AlbumWithStats | null> => {
      if (!albumId || !user) return null;

      const { data: album, error } = await supabase
        .from("albums")
        .select("*")
        .eq("id", albumId)
        .eq("organizer_id", user.id)
        .single();

      if (error) throw error;

      const { count } = await supabase
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .eq("album_id", album.id);

      return {
        ...album,
        submission_count: count || 0,
      };
    },
    enabled: !!albumId && !!user,
  });
}

export function useCreateAlbum() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<AlbumInsert, "organizer_id">) => {
      if (!user) throw new Error("Not authenticated");

      const { data: album, error } = await supabase
        .from("albums")
        .insert({
          ...data,
          organizer_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return album;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
    },
  });
}

export function useUpdateAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: AlbumUpdate & { id: string }) => {
      const { data: album, error } = await supabase
        .from("albums")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return album;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      queryClient.invalidateQueries({ queryKey: ["album", variables.id] });
    },
  });
}

export function useDeleteAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (albumId: string) => {
      const { error } = await supabase
        .from("albums")
        .delete()
        .eq("id", albumId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
    },
  });
}

export function useLockAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ albumId, isLocked }: { albumId: string; isLocked: boolean }) => {
      const { data: album, error } = await supabase
        .from("albums")
        .update({ is_locked: isLocked })
        .eq("id", albumId)
        .select()
        .single();

      if (error) throw error;
      return album;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      queryClient.invalidateQueries({ queryKey: ["album", variables.albumId] });
    },
  });
}
