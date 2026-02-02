import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Extracts the storage path from various input formats.
 * Handles:
 * - Direct storage paths: "albumId/participantId.jpg"
 * - Public URLs: "https://xxx.supabase.co/storage/v1/object/public/photos/albumId/participantId.jpg"
 * - Signed URLs: "https://xxx.supabase.co/storage/v1/object/sign/photos/albumId/participantId.jpg?token=..."
 */
function extractStoragePath(input: string): string {
  if (!input) return input;
  
  try {
    // Check if it's already a storage path (no http/https prefix)
    if (!input.startsWith("http://") && !input.startsWith("https://")) {
      // It's already a storage path like "albumId/participantId.jpg"
      return input;
    }
    
    // Check if it's a Supabase storage URL with public path
    const publicMatch = input.match(/\/storage\/v1\/object\/public\/photos\/(.+)$/);
    if (publicMatch) {
      return publicMatch[1];
    }
    
    // Check for signed URL format
    const signMatch = input.match(/\/storage\/v1\/object\/sign\/photos\/(.+?)(?:\?|$)/);
    if (signMatch) {
      return signMatch[1];
    }
    
    // Not a recognized format, return as-is
    return input;
  } catch {
    return input;
  }
}

/**
 * Hook to generate a signed URL for a photo stored in private Supabase storage.
 * Accepts either a storage path or a legacy public URL.
 * 
 * @param photoPathOrUrl - Storage path (e.g., "albumId/file.jpg") or legacy URL
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 */
export function useSignedPhotoUrl(
  photoPathOrUrl: string | null | undefined,
  expiresIn: number = 3600
): { signedUrl: string | null; isLoading: boolean; error: Error | null } {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!photoPathOrUrl) {
      setSignedUrl(null);
      return;
    }

    const generateSignedUrl = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Extract storage path from input (handles both paths and legacy URLs)
        const storagePath = extractStoragePath(photoPathOrUrl);

        const { data, error: signError } = await supabase.storage
          .from("photos")
          .createSignedUrl(storagePath, expiresIn);

        if (signError) {
          console.error("Failed to generate signed URL:", signError);
          setSignedUrl(null);
          setError(signError as Error);
          return;
        }

        setSignedUrl(data.signedUrl);
      } catch (err) {
        console.error("Error generating signed URL:", err);
        setSignedUrl(null);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    generateSignedUrl();
  }, [photoPathOrUrl, expiresIn]);

  return { signedUrl, isLoading, error };
}

/**
 * Generates signed URLs for multiple photos at once.
 * Useful for batch processing in album views.
 */
export async function generateSignedUrls(
  pathsOrUrls: (string | null | undefined)[],
  expiresIn: number = 3600
): Promise<(string | null)[]> {
  return Promise.all(
    pathsOrUrls.map(async (pathOrUrl) => {
      if (!pathOrUrl) return null;

      const storagePath = extractStoragePath(pathOrUrl);

      try {
        const { data, error } = await supabase.storage
          .from("photos")
          .createSignedUrl(storagePath, expiresIn);

        if (error) {
          console.error("Failed to generate signed URL:", error);
          return null;
        }

        return data.signedUrl;
      } catch {
        return null;
      }
    })
  );
}

/**
 * Single function to get a signed URL (non-hook version for callbacks).
 */
export async function getSignedPhotoUrl(
  photoPathOrUrl: string | null | undefined,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!photoPathOrUrl) return null;

  const storagePath = extractStoragePath(photoPathOrUrl);

  try {
    const { data, error } = await supabase.storage
      .from("photos")
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      console.error("Failed to generate signed URL:", error);
      return null;
    }

    return data.signedUrl;
  } catch {
    return null;
  }
}
