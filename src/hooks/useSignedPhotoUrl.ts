import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Extracts the storage path from a Supabase public URL.
 * Handles URLs like: https://xxx.supabase.co/storage/v1/object/public/photos/albumId/participantId.jpg
 */
function extractStoragePath(publicUrl: string): string | null {
  try {
    // Check if it's a Supabase storage URL
    const match = publicUrl.match(/\/storage\/v1\/object\/public\/photos\/(.+)$/);
    if (match) {
      return match[1];
    }
    // Alternative format: /storage/v1/object/sign/photos/...
    const signMatch = publicUrl.match(/\/storage\/v1\/object\/sign\/photos\/(.+)$/);
    if (signMatch) {
      return signMatch[1].split("?")[0]; // Remove query params
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Hook to generate a signed URL for a photo stored in private Supabase storage.
 * Falls back to the original URL if signed URL generation fails.
 * 
 * @param publicUrl - The original public URL or storage path
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 */
export function useSignedPhotoUrl(
  publicUrl: string | null | undefined,
  expiresIn: number = 3600
): { signedUrl: string | null; isLoading: boolean; error: Error | null } {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!publicUrl) {
      setSignedUrl(null);
      return;
    }

    const generateSignedUrl = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const storagePath = extractStoragePath(publicUrl);
        
        if (!storagePath) {
          // Not a recognized storage URL, use original
          setSignedUrl(publicUrl);
          return;
        }

        const { data, error: signError } = await supabase.storage
          .from("photos")
          .createSignedUrl(storagePath, expiresIn);

        if (signError) {
          console.error("Failed to generate signed URL:", signError);
          // Fall back to original URL (may not work if bucket is private)
          setSignedUrl(publicUrl);
          setError(signError as Error);
          return;
        }

        setSignedUrl(data.signedUrl);
      } catch (err) {
        console.error("Error generating signed URL:", err);
        setSignedUrl(publicUrl);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    generateSignedUrl();
  }, [publicUrl, expiresIn]);

  return { signedUrl, isLoading, error };
}

/**
 * Generates signed URLs for multiple photos at once.
 * Useful for batch processing in album views.
 */
export async function generateSignedUrls(
  urls: (string | null | undefined)[],
  expiresIn: number = 3600
): Promise<(string | null)[]> {
  return Promise.all(
    urls.map(async (url) => {
      if (!url) return null;

      const storagePath = extractStoragePath(url);
      if (!storagePath) return url;

      try {
        const { data, error } = await supabase.storage
          .from("photos")
          .createSignedUrl(storagePath, expiresIn);

        if (error) {
          console.error("Failed to generate signed URL:", error);
          return url;
        }

        return data.signedUrl;
      } catch {
        return url;
      }
    })
  );
}

/**
 * Single function to get a signed URL (non-hook version for callbacks).
 */
export async function getSignedPhotoUrl(
  publicUrl: string | null | undefined,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!publicUrl) return null;

  const storagePath = extractStoragePath(publicUrl);
  if (!storagePath) return publicUrl;

  try {
    const { data, error } = await supabase.storage
      .from("photos")
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      console.error("Failed to generate signed URL:", error);
      return publicUrl;
    }

    return data.signedUrl;
  } catch {
    return publicUrl;
  }
}
