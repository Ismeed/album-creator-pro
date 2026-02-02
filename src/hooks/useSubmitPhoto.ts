import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PublicAlbum } from "@/hooks/usePublicAlbum";
import { triggerImageProcessing, type BackgroundColor } from "@/hooks/useImageProcessing";
import type { ParticipantFormData, ParticipantRole } from "@/components/submission/ParticipantDetailsForm";

interface SubmissionData extends ParticipantFormData {
  photoFile: File;
  backgroundColor?: BackgroundColor;
}

interface SubmissionResult {
  participantId: string;
  submissionId: string;
  photoUrl: string;
}

// Edge function URL for participant creation
const SUBMIT_PARTICIPANT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-participant`;

export function useSubmitPhoto(album: PublicAlbum | null) {
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (data: SubmissionData): Promise<SubmissionResult> => {
      if (!album) throw new Error("Album not found");

      setUploadProgress(10);

      // Step 1: Check if participant already submitted (by name + album)
      const { data: existingSubmissions, error: checkError } = await supabase
        .from("submissions")
        .select(`
          id,
          participant:participants!inner(full_name)
        `)
        .eq("album_id", album.id);

      if (checkError) throw checkError;

      // Check for duplicate by name (case-insensitive)
      const duplicate = existingSubmissions?.find(
        (sub: any) => sub.participant?.full_name?.toLowerCase() === data.fullName.toLowerCase()
      );

      if (duplicate) {
        throw new Error("You have already submitted a photo for this album.");
      }

      setUploadProgress(20);

      // Step 2: Create participant via edge function (bypasses RLS using service role)
      const participantResponse = await fetch(SUBMIT_PARTICIPANT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          albumId: album.id,
          fullName: data.fullName.trim(),
          departmentOrClass: data.departmentOrClass?.trim() || null,
          identifier: data.identifier?.trim() || null,
          graduationYear: data.graduationYear?.trim() || null,
          role: (data.role as ParticipantRole) || "participant",
          quote: data.quote?.trim() || null,
          cohort: data.cohort?.trim() || null,
        }),
      });

      if (!participantResponse.ok) {
        const errorData = await participantResponse.json();
        throw new Error(errorData.error || "Failed to create participant");
      }

      const { participant } = await participantResponse.json();

      setUploadProgress(40);

      // Step 3: Upload photo to storage
      const fileExt = data.photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${album.id}/${participant.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(fileName, data.photoFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        // Note: participant cleanup would need a separate edge function
        // For now, we log and throw
        console.error("Photo upload failed:", uploadError);
        throw new Error("Failed to upload photo. Please try again.");
      }

      setUploadProgress(70);

      // Step 4: Store the storage path (not public URL) since bucket is private
      const photoPath = fileName;

      setUploadProgress(85);

      // Step 5: Create submission record
      const paymentStatus = album.payment_mode === "organizer_pays" ? "successful" : "pending";

      const { data: submission, error: submissionError } = await supabase
        .from("submissions")
        .insert({
          album_id: album.id,
          participant_id: participant.id,
          photo_url: photoPath,
          payment_status: paymentStatus,
          approval_status: "pending",
          background_color: data.backgroundColor || "white",
        })
        .select()
        .single();

      if (submissionError) {
        // Clean up photo if submission fails
        await supabase.storage.from("photos").remove([fileName]);
        throw submissionError;
      }

      setUploadProgress(100);

      // Step 6: Trigger async image processing (fire and forget)
      triggerImageProcessing(submission.id, data.backgroundColor || "white");

      return {
        participantId: participant.id,
        submissionId: submission.id,
        photoUrl: photoPath,
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
