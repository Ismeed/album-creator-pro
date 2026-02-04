import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";
import { 
  Check, 
  Loader2,
  AlertCircle,
  Lock,
  Clock,
  Calendar,
  Mail
} from "lucide-react";
import { usePublicAlbum, useAlbumStatus } from "@/hooks/usePublicAlbum";
import { useSubmitPhoto } from "@/hooks/useSubmitPhoto";
import { PhotoUploader } from "@/components/submission/PhotoUploader";
import { DynamicParticipantForm, type DynamicFormData } from "@/components/submission/DynamicParticipantForm";
import {
  parseSchemaConfig,
  createDefaultSchemaConfig,
  type StoredSchemaConfig,
} from "@/types/field-schemas";

type SubmissionStep = "upload" | "details" | "success";

const ParticipantSubmitPage = () => {
  const { albumId } = useParams<{ albumId: string }>();
  
  // Step-based flow state
  const [step, setStep] = useState<SubmissionStep>("upload");
  
  // Photo state - persisted across steps
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Form data for success display
  const [submittedData, setSubmittedData] = useState<DynamicFormData | null>(null);

  const { data: album, isLoading: albumLoading, error: albumError } = usePublicAlbum(albumId);
  const albumStatus = useAlbumStatus(album);
  const submitMutation = useSubmitPhoto(album ?? null);

  // Parse schema config from album
  const schemaConfig: StoredSchemaConfig = useMemo(() => {
    if (!album?.required_fields) {
      return createDefaultSchemaConfig(album?.album_type || "other");
    }
    const parsed = parseSchemaConfig(album.required_fields);
    return parsed || createDefaultSchemaConfig(album.album_type);
  }, [album?.required_fields, album?.album_type]);

  // Get departments for faculty albums
  const departments = useMemo(() => {
    if (!album?.required_fields) return undefined;
    const parsed = parseSchemaConfig(album.required_fields);
    return parsed?.departments;
  }, [album?.required_fields]);

  // Handle photo selection from uploader
  const handlePhotoSelected = useCallback((file: File, preview: string) => {
    setSelectedFile(file);
    setPreviewUrl(preview);
    setStep("details");
  }, []);

  // Handle clearing photo
  const handleClearPhoto = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setStep("upload");
  }, []);

  // Handle going back from details to upload
  const handleBackToUpload = useCallback(() => {
    setStep("upload");
  }, []);

  // Handle form submission
  const handleSubmit = async (data: DynamicFormData) => {
    if (!selectedFile || !album) return;

    try {
      await submitMutation.mutateAsync({
        fullName: data.full_name || "",
        email: data.email || "",
        departmentOrClass: data.department_or_class,
        identifier: data.identifier,
        graduationYear: data.graduation_year,
        role: data.role,
        quote: data.quote,
        cohort: data.cohort,
        photoFile: selectedFile,
      });

      setSubmittedData(data);
      setStep("success");
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

      {/* Step indicator */}
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
            <DynamicParticipantForm
              key="details"
              schemaConfig={schemaConfig}
              previewUrl={previewUrl}
              onSubmit={handleSubmit}
              onBack={handleBackToUpload}
              isSubmitting={submitMutation.isPending}
              uploadProgress={submitMutation.uploadProgress}
              error={submitMutation.error}
              departments={departments}
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
                Thank you! Your photo will appear in the album after review.
              </p>

              {/* Email confirmation notice */}
              {submittedData?.email && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 p-4 rounded-xl bg-success/10 border border-success/20 max-w-xs mx-auto"
                >
                  <div className="flex items-center gap-2 text-success">
                    <Mail className="w-4 h-4" />
                    <p className="text-sm font-medium">Confirmation Sent</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check your email at <strong>{submittedData.email}</strong> for a confirmation with an edit link.
                  </p>
                </motion.div>
              )}

              {previewUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6"
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
                        {submittedData.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {submittedData.department_or_class || submittedData.cohort}
                      </p>
                    </>
                  )}
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
