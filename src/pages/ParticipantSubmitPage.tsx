import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Camera, 
  Upload, 
  User, 
  Building2,
  Hash,
  Check, 
  X,
  Loader2,
  AlertCircle,
  Lock,
  Clock,
  Calendar
} from "lucide-react";
import { usePublicAlbum, useAlbumStatus } from "@/hooks/usePublicAlbum";
import { useSubmitPhoto } from "@/hooks/useSubmitPhoto";
import { useInitializePayment } from "@/hooks/usePayment";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().trim().email("Please enter a valid email").optional().or(z.literal("")),
  departmentOrClass: z.string().trim().min(1, "Department/Class is required").max(100, "Too long"),
  identifier: z.string().trim().max(50, "ID is too long").optional(),
});

type FormData = z.infer<typeof formSchema>;

const ParticipantSubmitPage = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "details" | "success">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const { data: album, isLoading: albumLoading, error: albumError } = usePublicAlbum(albumId);
  const albumStatus = useAlbumStatus(album);
  const submitMutation = useSubmitPhoto(album ?? null);
  const initPayment = useInitializePayment();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      departmentOrClass: "",
      identifier: "",
    },
  });

  const formValues = watch();

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Please upload a JPG or PNG image.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Photo must be under 10MB.";
    }
    return null;
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);

    if (file) {
      const error = validateFile(file);
      if (error) {
        setFileError(error);
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setStep("details");
      };
      reader.readAsDataURL(file);
    }
  }, [validateFile]);

  const handleClearPhoto = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError(null);
    setStep("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!selectedFile || !album) return;

    try {
      const result = await submitMutation.mutateAsync({
        fullName: data.fullName,
        departmentOrClass: data.departmentOrClass,
        identifier: data.identifier,
        photoFile: selectedFile,
      });

      // Check if payment is required (participant_pays mode)
      if (album.payment_mode === "participant_pays" && album.price_per_participant && album.price_per_participant > 0) {
        // Redirect to payment page
        const email = data.email || `${data.fullName.toLowerCase().replace(/\s+/g, '')}@temp.olex.app`;
        const callbackUrl = `${window.location.origin}/album/${albumId}/payment?submission_id=${result.submissionId}&email=${encodeURIComponent(email)}`;
        
        initPayment.mutate({
          submissionId: result.submissionId,
          email,
          callbackUrl,
        });
      } else {
        // No payment needed, show success
        setStep("success");
      }
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  // For participant_pays mode, email is required for payment
  const requiresPayment = album?.payment_mode === "participant_pays" && (album?.price_per_participant || 0) > 0;
  const canSubmit = formValues.fullName.length >= 2 && 
    formValues.departmentOrClass.length >= 1 && 
    (!requiresPayment || (formValues.email && formValues.email.includes("@")));

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

              {/* Upload area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`aspect-[3/4] max-w-xs mx-auto rounded-2xl border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center gap-4 p-6 ${
                  fileError 
                    ? "border-destructive bg-destructive/5" 
                    : "border-border hover:border-accent hover:bg-accent/5"
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  fileError ? "bg-destructive/10" : "bg-muted"
                }`}>
                  <Camera className={`w-8 h-8 ${fileError ? "text-destructive" : "text-muted-foreground"}`} />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">
                    Tap to upload photo
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG or PNG, max 10MB
                  </p>
                </div>
                <Button variant="accent" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Photo
                </Button>
              </div>

              {fileError && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive text-center flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  {fileError}
                </motion.p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </motion.div>
          )}

          {/* Step 2: Enter Details */}
          {step === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Photo preview */}
                <div className="relative aspect-[3/4] max-w-[200px] mx-auto rounded-xl overflow-hidden shadow-card">
                  {previewUrl && (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleClearPhoto}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-foreground hover:bg-background transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center">
                  <h2 className="text-xl font-bold text-foreground">
                    Your Details
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add your information for the album
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="fullName"
                        placeholder="Your full name"
                        {...register("fullName")}
                        className="pl-11 h-12"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName.message}</p>
                    )}
                  </div>

                  {requiresPayment && (
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <div className="relative">
                        <svg 
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                          />
                        </svg>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          {...register("email")}
                          className="pl-11 h-12"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Required for payment receipt
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="departmentOrClass">Department / Class *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="departmentOrClass"
                        placeholder="e.g., Computer Science"
                        {...register("departmentOrClass")}
                        className="pl-11 h-12"
                      />
                    </div>
                    {errors.departmentOrClass && (
                      <p className="text-sm text-destructive">{errors.departmentOrClass.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="identifier">Student/Employee ID (optional)</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="identifier"
                        placeholder="e.g., 2025/CS/001"
                        {...register("identifier")}
                        className="pl-11 h-12"
                      />
                    </div>
                    {errors.identifier && (
                      <p className="text-sm text-destructive">{errors.identifier.message}</p>
                    )}
                  </div>
                </div>

                {/* Upload Progress */}
                {submitMutation.isPending && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Uploading...</span>
                      <span className="font-medium text-foreground">{submitMutation.uploadProgress}%</span>
                    </div>
                    <Progress value={submitMutation.uploadProgress} className="h-2" />
                  </motion.div>
                )}

                {/* Error */}
                {submitMutation.error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-destructive/10 border border-destructive/20"
                  >
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                      <div>
                        <p className="font-medium text-destructive">Submission Failed</p>
                        <p className="text-sm text-destructive/80 mt-1">
                          {submitMutation.error.message}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <Button 
                  type="submit" 
                  variant="accent" 
                  size="lg" 
                  className="w-full"
                  disabled={!canSubmit || submitMutation.isPending}
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Submit Photo
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
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
                  <p className="text-sm text-muted-foreground mt-3">
                    {formValues.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formValues.departmentOrClass}
                  </p>
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
