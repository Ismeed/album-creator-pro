import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { PublicAlbum } from "@/hooks/usePublicAlbum";

// Flexible submission data that works with dynamic forms
export interface SubmissionData {
  fullName: string;
  email: string;
  departmentOrClass?: string;
  identifier?: string;
  graduationYear?: string;
  role?: string;
  quote?: string;
  cohort?: string;
  photoFile: File;
  customFieldValues?: Record<string, string>;
}

interface SubmissionResult {
  participantId: string;
  submissionId: string;
  photoUrl: string;
}

export function useSubmitPhoto(album: PublicAlbum | null) {
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (data: SubmissionData): Promise<SubmissionResult> => {
      if (!album) throw new Error("Album not found");

      setUploadProgress(10);

      // Build form data for multipart upload
      const formData = new FormData();
      formData.append("albumId", album.id);
      formData.append("fullName", data.fullName.trim());
      formData.append("email", data.email.trim());
      formData.append("photo", data.photoFile);

      // Optional fields
      if (data.departmentOrClass) {
        formData.append("departmentOrClass", data.departmentOrClass.trim());
      }
      if (data.identifier) {
        formData.append("identifier", data.identifier.trim());
      }
      if (data.graduationYear) {
        formData.append("graduationYear", data.graduationYear.trim());
      }
      if (data.role) {
        formData.append("role", data.role.trim());
      }
      if (data.quote) {
        formData.append("quote", data.quote.trim());
      }
      if (data.cohort) {
        formData.append("cohort", data.cohort.trim());
      }
      
      // Custom field values
      if (data.customFieldValues && Object.keys(data.customFieldValues).length > 0) {
        formData.append("customFieldValues", JSON.stringify(data.customFieldValues));
      }

      setUploadProgress(30);

      // Build the edge function URL using environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !apiKey) {
        throw new Error("Missing required configuration. Please contact support.");
      }

      const submitUrl = `${supabaseUrl}/functions/v1/submit-participant`;
      console.log("Submitting to:", submitUrl);

      // Send to edge function (handles participant, photo upload, and submission atomically)
      let response: Response;
      try {
        response = await fetch(submitUrl, {
          method: "POST",
          headers: {
            "apikey": apiKey,
          },
          body: formData,
        });
        console.log("Response status:", response.status);
      } catch (fetchError: any) {
        console.error("Fetch error details:", {
          name: fetchError?.name,
          message: fetchError?.message,
          stack: fetchError?.stack
        });
        throw new Error(`Submission failed: ${fetchError?.message || "Network error"}`);
      }

      setUploadProgress(80);

      if (!response.ok) {
        // Show user-friendly error message
        let errorMessage = "Submission failed. Please refresh and try again.";
        try {
          const errorData = await response.json();
          // Only show specific errors for known user-fixable issues
          if (errorData.error) {
            const userFriendlyErrors = [
              "Album not found",
              "This album is locked",
              "already submitted",
              "submission deadline",
              "Please enter a valid email",
              "Full name must be",
              "Photo file is required",
              "Photo file is too large",
              "Invalid file type",
            ];
            const isUserFriendly = userFriendlyErrors.some(e => errorData.error.includes(e));
            if (isUserFriendly) {
              errorMessage = errorData.error;
            }
          }
        } catch {
          // Keep default error message
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      setUploadProgress(100);

      return {
        participantId: result.participantId,
        submissionId: result.submissionId,
        photoUrl: result.photoUrl,
      };
    },
    onSettled: () => {
      // Reset progress after a delay
      setTimeout(() => setUploadProgress(0), 500);
    },
  });

  return {
    ...mutation,
    uploadProgress,
  };
}
