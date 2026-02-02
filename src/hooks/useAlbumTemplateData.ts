import { useMemo } from "react";
import { useAlbum } from "@/hooks/useAlbums";
import { useAlbumSubmissions } from "@/hooks/useSubmissions";
import { prepareAlbumTemplateData, type AlbumTemplateData } from "@/types/album-templates";

interface UseAlbumTemplateDataResult {
  templateData: AlbumTemplateData | null;
  isLoading: boolean;
  error: Error | null;
  totalSubmissions: number;
  eligibleCount: number;
}

export function useAlbumTemplateData(
  albumId: string | undefined,
  templateId: string = "classic"
): UseAlbumTemplateDataResult {
  const {
    data: album,
    isLoading: albumLoading,
    error: albumError,
  } = useAlbum(albumId);

  const {
    data: submissions,
    isLoading: submissionsLoading,
    error: submissionsError,
  } = useAlbumSubmissions(albumId);

  const templateData = useMemo(() => {
    if (!album || !submissions) return null;
    return prepareAlbumTemplateData(album, submissions, templateId);
  }, [album, submissions, templateId]);

  const totalSubmissions = submissions?.length || 0;
  const eligibleCount = templateData?.participants.length || 0;

  return {
    templateData,
    isLoading: albumLoading || submissionsLoading,
    error: albumError || submissionsError,
    totalSubmissions,
    eligibleCount,
  };
}
