import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Image, Users, Calendar, Check, Loader2, Building2, DollarSign } from "lucide-react";
import { useCreateAlbum } from "@/hooks/useAlbums";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type AlbumType = Database["public"]["Enums"]["album_type"];
type PaymentMode = Database["public"]["Enums"]["payment_mode"];

const albumTypes: { value: AlbumType; label: string }[] = [
  { value: "class", label: "Class" },
  { value: "department", label: "Department" },
  { value: "faculty", label: "Faculty" },
  { value: "training", label: "Training" },
  { value: "bootcamp", label: "Bootcamp" },
  { value: "other", label: "Other" },
];

const paymentModes: { value: PaymentMode; label: string }[] = [
  { value: "organizer_pays", label: "Organizer Pays" },
  { value: "participant_pays", label: "Participant Pays" },
];

const formSchema = z.object({
  title: z.string().min(1, "Album title is required"),
  institution_name: z.string().min(1, "Institution name is required"),
  album_type: z.enum(["class", "department", "faculty", "training", "bootcamp", "other"] as const),
  payment_mode: z.enum(["organizer_pays", "participant_pays"] as const),
  price_per_participant: z.string().optional(),
  submission_deadline: z.string().optional(),
}).refine((data) => {
  // If participant pays, price is required
  if (data.payment_mode === "participant_pays") {
    return data.price_per_participant && parseFloat(data.price_per_participant) > 0;
  }
  return true;
}, {
  message: "Price per participant is required when participants pay",
  path: ["price_per_participant"],
}).refine((data) => {
  // Deadline must be in the future if set
  if (data.submission_deadline) {
    return new Date(data.submission_deadline) > new Date();
  }
  return true;
}, {
  message: "Deadline must be in the future",
  path: ["submission_deadline"],
});

type FormData = z.infer<typeof formSchema>;

const CreateAlbumPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const createAlbum = useCreateAlbum();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      institution_name: "",
      album_type: "class",
      payment_mode: "organizer_pays",
      price_per_participant: "",
      submission_deadline: "",
    },
  });

  const paymentMode = watch("payment_mode");
  const formValues = watch();

  const onSubmit = async (data: FormData) => {
    if (step < 2) {
      const isValid = await trigger(["title", "institution_name", "album_type"]);
      if (isValid) {
        setStep(2);
      }
      return;
    }

    try {
      const album = await createAlbum.mutateAsync({
        title: data.title,
        institution_name: data.institution_name,
        album_type: data.album_type,
        payment_mode: data.payment_mode,
        price_per_participant: data.price_per_participant 
          ? parseFloat(data.price_per_participant) 
          : null,
        submission_deadline: data.submission_deadline || null,
      });

      toast({
        title: "Album created!",
        description: "Your album is ready. Share the link to collect photos.",
      });

      navigate(`/album/${album.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create album. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceedStep1 = formValues.title.length > 0 && formValues.institution_name.length > 0;
  const canProceedStep2 = paymentMode === "organizer_pays" || 
    (formValues.price_per_participant && parseFloat(formValues.price_per_participant) > 0);

  return (
    <main className="min-h-[100dvh] bg-background safe-top safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="mobile-container flex items-center h-16">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors -ml-2 p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold text-foreground ml-2">Create Album</h1>
        </div>
      </header>

      {/* Progress */}
      <div className="mobile-container py-4">
        <div className="flex gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-accent" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Step {step} of 2
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="mobile-container pb-8">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center mx-auto mb-4">
                <Image className="w-8 h-8 text-accent-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Album Details
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Set up your photo collection album
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Album Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Class of 2025 - Engineering"
                {...register("title")}
                className="h-12"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution_name">
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Institution Name *
                </span>
              </Label>
              <Input
                id="institution_name"
                placeholder="e.g., Stanford University"
                {...register("institution_name")}
                className="h-12"
              />
              {errors.institution_name && (
                <p className="text-sm text-destructive">{errors.institution_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Album Type
                </span>
              </Label>
              <Select
                value={formValues.album_type}
                onValueChange={(value: AlbumType) => setValue("album_type", value)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select album type" />
                </SelectTrigger>
                <SelectContent>
                  {albumTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-accent-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Payment & Deadline
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure billing and collection settings
              </p>
            </div>

            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select
                value={formValues.payment_mode}
                onValueChange={(value: PaymentMode) => setValue("payment_mode", value)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select who pays" />
                </SelectTrigger>
                <SelectContent>
                  {paymentModes.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {paymentMode === "organizer_pays" 
                  ? "You pay for the album generation"
                  : "Each participant pays individually"}
              </p>
            </div>

            {paymentMode === "participant_pays" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="price_per_participant">
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Price Per Participant *
                  </span>
                </Label>
                <Input
                  id="price_per_participant"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 5.00"
                  {...register("price_per_participant")}
                  className="h-12"
                />
                {errors.price_per_participant && (
                  <p className="text-sm text-destructive">{errors.price_per_participant.message}</p>
                )}
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="submission_deadline">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Submission Deadline (optional)
                </span>
              </Label>
              <Input
                id="submission_deadline"
                type="datetime-local"
                {...register("submission_deadline")}
                className="h-12"
              />
              {errors.submission_deadline && (
                <p className="text-sm text-destructive">{errors.submission_deadline.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                When should participants submit by?
              </p>
            </div>

            {/* Summary */}
            <div className="rounded-xl bg-muted/50 p-4 space-y-3">
              <h3 className="font-medium text-foreground text-sm">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Title</span>
                  <span className="font-medium text-foreground truncate ml-4 text-right max-w-[60%]">
                    {formValues.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Institution</span>
                  <span className="font-medium text-foreground truncate ml-4 text-right max-w-[60%]">
                    {formValues.institution_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium text-foreground">
                    {albumTypes.find(t => t.value === formValues.album_type)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-medium text-foreground">
                    {paymentModes.find(m => m.value === formValues.payment_mode)?.label}
                  </span>
                </div>
                {paymentMode === "participant_pays" && formValues.price_per_participant && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-medium text-foreground">
                      ${formValues.price_per_participant}/person
                    </span>
                  </div>
                )}
                {formValues.submission_deadline && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deadline</span>
                    <span className="font-medium text-foreground">
                      {new Date(formValues.submission_deadline).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="mt-8 space-y-3">
          <Button 
            type="submit" 
            variant="accent" 
            size="lg" 
            className="w-full"
            disabled={
              (step === 1 && !canProceedStep1) || 
              (step === 2 && !canProceedStep2) ||
              createAlbum.isPending
            }
          >
            {createAlbum.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating...
              </>
            ) : step === 2 ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Create Album
              </>
            ) : (
              "Continue"
            )}
          </Button>

          {step > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="w-full"
              onClick={handleBack}
              disabled={createAlbum.isPending}
            >
              Back
            </Button>
          )}
        </div>
      </form>
    </main>
  );
};

export default CreateAlbumPage;
