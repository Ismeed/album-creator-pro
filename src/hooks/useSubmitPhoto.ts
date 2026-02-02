import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { PublicAlbum } from "@/hooks/usePublicAlbum";
import type { ParticipantFormData, ParticipantRole } from "@/components/submission/ParticipantDetailsForm";
import type { BackgroundColor } from "@/hooks/useImageProcessing";

interface SubmissionData extends ParticipantFormData {
  photoFile: File;
  backgroundColor?: BackgroundColor;
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
      formData.append("photo", data.photoFile);
      formData.append("backgroundColor", data.backgroundColor || "white");
      formData.append("paymentMode", album.payment_mode);

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
        formData.append("role", data.role as ParticipantRole);
      }
      if (data.quote) {
        formData.append("quote", data.quote.trim());
      }
      if (data.cohort) {
        formData.append("cohort", data.cohort.trim());
      }

      setUploadProgress(30);

      // Build the edge function URL using environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://rlerhmkryfqzfvfuxpvl.supabase.co";
      const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZXJobWtyeWZxemZ2ZnV4cHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NjE5NzMsImV4cCI6MjA4NTUzNzk3M30.XsNsWpCZCIeiMnMOtITjuKaWKggt5_C_6J8l2Q1jwzs";

      const submitUrl = `${supabaseUrl}/functions/v1/submit-participant`;
      console.log("Submitting to:", submitUrl);
      console.log("Form data keys:", [...formData.keys()]);

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
        let errorMessage = "Submission failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status}`;
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
