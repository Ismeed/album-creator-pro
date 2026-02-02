import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";
import { 
  Check, 
  Loader2,
  AlertCircle,
  Lock,
  Clock,
  Calendar
} from "lucide-react";
import { usePublicAlbum, useAlbumStatus } from "@/hooks/usePublicAlbum";
import { useSubmitPhoto } from "@/hooks/useSubmitPhoto";
import { useInitializePayment } from "@/hooks/usePayment";
import { PhotoUploader } from "@/components/submission/PhotoUploader";
import { ParticipantDetailsForm, type ParticipantField, type ParticipantFormData } from "@/components/submission/ParticipantDetailsForm";
import type { BackgroundColor } from "@/hooks/useImageProcessing";

type SubmissionStep = "upload" | "preview" | "details" | "success";

const ParticipantSubmitPage = () => {
  const { albumId } = useParams<{ albumId: string }>();
  
  // Step-based flow state
  const [step, setStep] = useState<SubmissionStep>("upload");
  
  // Photo state - persisted across steps
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<BackgroundColor>("white");
  
  // Form data for success display
  const [submittedData, setSubmittedData] = useState<ParticipantFormData | null>(null);

  const { data: album, isLoading: albumLoading, error: albumError } = usePublicAlbum(albumId);
  const albumStatus = useAlbumStatus(album);
  const submitMutation = useSubmitPhoto(album ?? null);
  const initPayment = useInitializePayment();

  // Get required fields from album config (default to basic fields)
  const requiredFields: ParticipantField[] = album?.required_fields 
    ? (album.required_fields as ParticipantField[])
    : ["full_name", "department_or_class"];

  const requiresPayment = album?.payment_mode === "participant_pays" && (album?.price_per_participant || 0) > 0;

  // Handle photo selection from uploader
  const handlePhotoSelected = useCallback((file: File, preview: string) => {
    setSelectedFile(file);
    setPreviewUrl(preview);
    // Go directly to details after photo is selected
    setStep("details");
  }, []);

  // Handle clearing photo - go back to upload step
  const handleClearPhoto = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setStep("upload");
  }, []);

  // Handle going back from details to upload
  const handleBackToUpload = useCallback(() => {
    // Keep the photo but go back to upload step to allow changing it
    setStep("upload");
  }, []);

  // Handle form submission
  const handleSubmit = async (data: ParticipantFormData) => {
    if (!selectedFile || !album) return;

    try {
      const result = await submitMutation.mutateAsync({
        ...data,
        photoFile: selectedFile,
        backgroundColor,
      });

      setSubmittedData(data);

      // Check if payment is required
      if (requiresPayment && album.price_per_participant && album.price_per_participant > 0) {
        const email = data.email || `${data.fullName.toLowerCase().replace(/\s+/g, '')}@temp.olex.app`;
        const callbackUrl = `${window.location.origin}/album/${albumId}/payment?submission_id=${result.submissionId}&email=${encodeURIComponent(email)}`;
        
        initPayment.mutate({
          submissionId: result.submissionId,
          email,
          callbackUrl,
        });
      } else {
        setStep("success");
      }
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  // Loading state
  if (albumLoading) {
    return (
      <main className="min-h-[100dvh] bg-background safe-top safe-bottom flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </main>
    );
  }

  // Album not found
  if (albumError || !album) {
    return (
      <main className="min-h-[100dvh] bg-background safe-top safe-bottom">
        <div className="mobile-container py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Album Not Found</h1>
          <p className="text-muted-foreground">
            This album doesn't exist or the link is invalid.
          </p>
        </div>
      </main>
    );
  }

  // Album closed
  if (!albumStatus.isOpen) {
    return (
      <main className="min-h-[100dvh] bg-background safe-top safe-bottom">
        <header className="bg-primary text-primary-foreground py-6">
          <div className="mobile-container text-center">
            <span className="text-accent font-bold text-lg">OLEX</span>
            <h1 className="text-xl font-bold mt-2">{album.title}</h1>
            {album.institution_name && (
              <p className="text-primary-foreground/70 text-sm mt-1">
                {album.institution_name}
              </p>
            )}
          </div>
        </header>
        
        <div className="mobile-container py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            {albumStatus.reason === "locked" ? (
              <Lock className="w-8 h-8 text-muted-foreground" />
            ) : (
              <Clock className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Submissions Closed</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            {albumStatus.message}
          </p>
          {album.submission_deadline && albumStatus.reason === "deadline_passed" && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Deadline was {new Date(album.submission_deadline).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-background safe-top safe-bottom">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6">
        <div className="mobile-container text-center">
          <span className="text-accent font-bold text-lg">OLEX</span>
          <h1 className="text-xl font-bold mt-2">{album.title}</h1>
          {album.institution_name && (
            <p className="text-primary-foreground/70 text-sm mt-1">
              {album.institution_name}
            </p>
          )}
          {album.submission_deadline && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary-foreground/60 bg-primary-foreground/10 px-3 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              <span>Submit by {new Date(album.submission_deadline).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </header>

      {/* Step indicator (visible during upload and details) */}
      {(step === "upload" || step === "details") && (
        <div className="mobile-container pt-4">
          <div className="flex gap-2">
            <div className={`h-1 flex-1 rounded-full transition-colors ${
              step === "upload" || step === "details" ? "bg-accent" : "bg-muted"
            }`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${
              step === "details" ? "bg-accent" : "bg-muted"
            }`} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Step {step === "upload" ? 1 : 2} of 2: {step === "upload" ? "Upload Photo" : "Your Details"}
          </p>
        </div>
      )}

      <div className="mobile-container py-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Upload Photo */}
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">
                  Upload Your Photo
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Take a clear photo with good lighting
                </p>
              </div>

              <PhotoUploader
                onPhotoSelected={handlePhotoSelected}
                previewUrl={previewUrl}
                onClear={handleClearPhoto}
              />
            </motion.div>
          )}

          {/* Step 2: Enter Details */}
          {step === "details" && previewUrl && (
            <ParticipantDetailsForm
              key="details"
              requiredFields={requiredFields}
              requiresPayment={requiresPayment}
              pricePerParticipant={album.price_per_participant}
              previewUrl={previewUrl}
              backgroundColor={backgroundColor}
              onBackgroundColorChange={setBackgroundColor}
              onSubmit={handleSubmit}
              onBack={handleBackToUpload}
              isSubmitting={submitMutation.isPending}
              uploadProgress={submitMutation.uploadProgress}
              error={submitMutation.error}
            />
          )}

          {/* Step 3: Success */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-success flex items-center justify-center mx-auto mb-6"
              >
                <Check className="w-10 h-10 text-success-foreground" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Photo Submitted!
              </h2>
              <p className="text-muted-foreground max-w-xs mx-auto">
                {album.payment_mode === "participant_pays" 
                  ? "Your photo has been submitted. You'll receive payment instructions soon."
                  : "Thank you! Your photo will appear in the album after review."}
              </p>

              {previewUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8"
                >
                  <div className="aspect-[3/4] max-w-[150px] mx-auto rounded-xl overflow-hidden shadow-card">
                    <img 
                      src={previewUrl} 
                      alt="Submitted photo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {submittedData && (
                    <>
                      <p className="text-sm text-muted-foreground mt-3">
                        {submittedData.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {submittedData.departmentOrClass}
                      </p>
                    </>
                  )}
                </motion.div>
              )}

              {album.payment_mode === "participant_pays" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 p-4 rounded-xl bg-accent/10 border border-accent/20 max-w-xs mx-auto"
                >
                  <p className="text-sm font-medium text-foreground">
                    Payment Required
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ${album.price_per_participant} per person
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

export default ParticipantSubmitPage;
