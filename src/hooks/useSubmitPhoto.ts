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

// Edge function URL for participant submission
const SUBMIT_PARTICIPANT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-participant`;

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

      // Send to edge function (handles participant, photo upload, and submission atomically)
      const response = await fetch(SUBMIT_PARTICIPANT_URL, {
        method: "POST",
        headers: {
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: formData,
      });

      setUploadProgress(80);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Submission failed");
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
