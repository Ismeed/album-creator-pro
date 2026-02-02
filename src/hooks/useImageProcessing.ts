import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BackgroundColor = "white" | "gray" | "blue" | "green";

export const BACKGROUND_COLOR_OPTIONS: { value: BackgroundColor; label: string; hex: string }[] = [
  { value: "white", label: "White", hex: "#FFFFFF" },
  { value: "gray", label: "Light Gray", hex: "#E5E5E5" },
  { value: "blue", label: "Blue", hex: "#1E40AF" },
  { value: "green", label: "Green", hex: "#166534" },
];

interface ProcessImageParams {
  submissionId: string;
  backgroundColor?: BackgroundColor;
}

interface ProcessImageResult {
  success: boolean;
  processedPhotoUrl?: string;
  backgroundColor?: string;
  fallback?: boolean;
  error?: string;
}

export function useProcessImage() {
  return useMutation({
    mutationFn: async (params: ProcessImageParams): Promise<ProcessImageResult> => {
      const { data, error } = await supabase.functions.invoke("process-image", {
        body: params,
      });

      if (error) {
        console.error("Process image error:", error);
        throw new Error(error.message || "Failed to process image");
      }

      return data;
    },
  });
}

// Fire-and-forget version for async processing
export async function triggerImageProcessing(
  submissionId: string,
  backgroundColor: BackgroundColor = "white"
): Promise<void> {
  try {
    // Fire and forget - don't await the result
    supabase.functions.invoke("process-image", {
      body: { submissionId, backgroundColor },
    }).catch((err) => {
      console.error("Background image processing failed:", err);
    });
  } catch (err) {
    console.error("Failed to trigger image processing:", err);
  }
}
