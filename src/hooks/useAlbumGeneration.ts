import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AlbumGeneration {
  id: string;
  album_id: string;
  status: "pending" | "generating" | "completed" | "failed";
  template_id: string;
  file_path: string | null;
  file_size_bytes: number | null;
  error_message: string | null;
  participant_count: number;
  created_at: string;
  completed_at: string | null;
}

interface GenerationConditions {
  isLocked: boolean;
  hasApprovedSubmissions: boolean;
  allPaymentsSuccessful: boolean;
  canGenerate: boolean;
  missingConditions: string[];
}

export function useAlbumGeneration(albumId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Subscribe to real-time updates
  useEffect(() => {
    if (!albumId) return;

    const channel = supabase
      .channel(`generations-${albumId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "album_generations",
          filter: `album_id=eq.${albumId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["album-generation", albumId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [albumId, queryClient]);

  // Fetch latest generation
  const generationQuery = useQuery({
    queryKey: ["album-generation", albumId],
    queryFn: async (): Promise<AlbumGeneration | null> => {
      if (!albumId) return null;

      const { data, error } = await supabase
        .from("album_generations")
        .select("*")
        .eq("album_id", albumId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as AlbumGeneration | null;
    },
    enabled: !!albumId,
  });

  // Check generation conditions (payments disabled for testing)
  const conditionsQuery = useQuery({
    queryKey: ["album-generation-conditions", albumId],
    queryFn: async (): Promise<GenerationConditions> => {
      if (!albumId) {
        return {
          isLocked: false,
          hasApprovedSubmissions: false,
          allPaymentsSuccessful: true, // Always true - payments disabled
          canGenerate: false,
          missingConditions: ["Album not found"],
        };
      }

      // Fetch album
      const { data: album, error: albumError } = await supabase
        .from("albums")
        .select("*")
        .eq("id", albumId)
        .single();

      if (albumError || !album) {
        return {
          isLocked: false,
          hasApprovedSubmissions: false,
          allPaymentsSuccessful: true,
          canGenerate: false,
          missingConditions: ["Album not found"],
        };
      }

      // Fetch submissions
      const { data: submissions } = await supabase
        .from("submissions")
        .select("approval_status")
        .eq("album_id", albumId);

      const approvedSubmissions = submissions?.filter(
        (s) => s.approval_status === "approved"
      ) || [];

      const isLocked = album.is_locked;
      const hasApprovedSubmissions = approvedSubmissions.length > 0;

      // Payments are disabled for testing - always successful
      const allPaymentsSuccessful = true;

      const missingConditions: string[] = [];
      if (!isLocked) missingConditions.push("Album must be locked");
      if (!hasApprovedSubmissions) missingConditions.push("At least one approved submission required");

      return {
        isLocked,
        hasApprovedSubmissions,
        allPaymentsSuccessful,
        canGenerate: isLocked && hasApprovedSubmissions,
        missingConditions,
      };
    },
    enabled: !!albumId,
  });

  // Start generation mutation
  const startGenerationMutation = useMutation({
    mutationFn: async ({ templateId = "classic" }: { templateId?: string }) => {
      if (!albumId) throw new Error("Album ID required");

      // Create generation record
      const { data: generation, error: createError } = await supabase
        .from("album_generations")
        .insert({
          album_id: albumId,
          template_id: templateId,
          status: "pending",
        })
        .select()
        .single();

      if (createError) throw createError;

      // Call edge function
      const { data, error } = await supabase.functions.invoke("generate-album-pdf", {
        body: {
          albumId,
          generationId: generation.id,
          templateId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Generation started", description: "Your album PDF is being generated." });
      queryClient.invalidateQueries({ queryKey: ["album-generation", albumId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to start generation",
        variant: "destructive",
      });
    },
  });

  // Get download URL
  const getDownloadUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from("album-pdfs")
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error("Failed to get download URL:", error);
      return null;
    }

    return data.signedUrl;
  };

  return {
    generation: generationQuery.data,
    isLoadingGeneration: generationQuery.isLoading,
    conditions: conditionsQuery.data,
    isLoadingConditions: conditionsQuery.isLoading,
    startGeneration: startGenerationMutation.mutate,
    isStarting: startGenerationMutation.isPending,
    getDownloadUrl,
  };
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
