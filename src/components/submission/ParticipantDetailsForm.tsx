import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Building2,
  Hash,
  GraduationCap,
  Users,
  Quote,
  Check,
  Loader2,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { BackgroundColorPicker } from "@/components/submission/BackgroundColorPicker";
import type { BackgroundColor } from "@/hooks/useImageProcessing";

// All possible participant fields
export type ParticipantField = 
  | "full_name" 
  | "department_or_class" 
  | "identifier" 
  | "graduation_year" 
  | "role" 
  | "quote" 
  | "cohort";

export const PARTICIPANT_ROLES = [
  { value: "graduate", label: "Graduate" },
  { value: "participant", label: "Participant" },
  { value: "facilitator", label: "Facilitator" },
  { value: "instructor", label: "Instructor" },
  { value: "mentor", label: "Mentor" },
  { value: "other", label: "Other" },
] as const;

export type ParticipantRole = typeof PARTICIPANT_ROLES[number]["value"];

// Dynamic schema based on required fields
const createFormSchema = (requiredFields: ParticipantField[], requiresPayment: boolean) => {
  return z.object({
    fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
    email: requiresPayment 
      ? z.string().trim().email("Please enter a valid email")
      : z.string().trim().email("Please enter a valid email").optional().or(z.literal("")),
    departmentOrClass: requiredFields.includes("department_or_class")
      ? z.string().trim().min(1, "Department/Class is required").max(100, "Too long")
      : z.string().trim().max(100, "Too long").optional(),
    identifier: requiredFields.includes("identifier")
      ? z.string().trim().min(1, "ID is required").max(50, "Too long")
      : z.string().trim().max(50, "Too long").optional(),
    graduationYear: requiredFields.includes("graduation_year")
      ? z.string().regex(/^\d{4}(\/\d{4})?$/, "Use format: 2025 or 2024/2025")
      : z.string().regex(/^\d{4}(\/\d{4})?$/, "Use format: 2025 or 2024/2025").optional().or(z.literal("")),
    role: requiredFields.includes("role")
      ? z.enum(["graduate", "participant", "facilitator", "instructor", "mentor", "other"])
      : z.enum(["graduate", "participant", "facilitator", "instructor", "mentor", "other"]).optional(),
    quote: requiredFields.includes("quote")
      ? z.string().trim().min(1, "Quote is required").max(200, "Quote must be under 200 characters")
      : z.string().trim().max(200, "Quote must be under 200 characters").optional(),
    cohort: requiredFields.includes("cohort")
      ? z.string().trim().min(1, "Cohort is required").max(100, "Too long")
      : z.string().trim().max(100, "Too long").optional(),
  });
};

export type ParticipantFormData = {
  fullName: string;
  email?: string;
  departmentOrClass?: string;
  identifier?: string;
  graduationYear?: string;
  role?: ParticipantRole;
  quote?: string;
  cohort?: string;
};

interface ParticipantDetailsFormProps {
  requiredFields: ParticipantField[];
  requiresPayment: boolean;
  pricePerParticipant?: number | null;
  previewUrl: string;
  backgroundColor: BackgroundColor;
  onBackgroundColorChange: (color: BackgroundColor) => void;
  onSubmit: (data: ParticipantFormData) => void;
  onBack: () => void;
  isSubmitting: boolean;
  uploadProgress: number;
  error: Error | null;
}

export function ParticipantDetailsForm({
  requiredFields,
  requiresPayment,
  pricePerParticipant,
  previewUrl,
  backgroundColor,
  onBackgroundColorChange,
  onSubmit,
  onBack,
  isSubmitting,
  uploadProgress,
  error,
}: ParticipantDetailsFormProps) {
  const formSchema = createFormSchema(requiredFields, requiresPayment);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<ParticipantFormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      departmentOrClass: "",
      identifier: "",
      graduationYear: "",
      role: "participant",
      quote: "",
      cohort: "",
    },
  });

  const isRequired = (field: ParticipantField) => requiredFields.includes(field);
  const roleValue = watch("role");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors -ml-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Change Photo</span>
        </button>

        {/* Photo preview - compact */}
        <div className="relative aspect-[3/4] max-w-[160px] mx-auto rounded-xl overflow-hidden shadow-card">
          <img 
            src={previewUrl} 
            alt="Your photo" 
            className="w-full h-full object-cover"
          />
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
          {/* Full Name - Always required */}
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

          {/* Email - Required for payment */}
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

          {/* Department/Class */}
          <div className="space-y-2">
            <Label htmlFor="departmentOrClass">
              Department / Class {isRequired("department_or_class") && "*"}
            </Label>
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

          {/* Cohort */}
          <div className="space-y-2">
            <Label htmlFor="cohort">
              Class / Cohort {isRequired("cohort") && "*"}
            </Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="cohort"
                placeholder="e.g., Cohort 5, Class of 2025"
                {...register("cohort")}
                className="pl-11 h-12"
              />
            </div>
            {errors.cohort && (
              <p className="text-sm text-destructive">{errors.cohort.message}</p>
            )}
          </div>

          {/* Graduation Year */}
          <div className="space-y-2">
            <Label htmlFor="graduationYear">
              Graduation / Program Year {isRequired("graduation_year") && "*"}
            </Label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="graduationYear"
                placeholder="e.g., 2025 or 2024/2025"
                {...register("graduationYear")}
                className="pl-11 h-12"
              />
            </div>
            {errors.graduationYear && (
              <p className="text-sm text-destructive">{errors.graduationYear.message}</p>
            )}
          </div>

          {/* Identifier (Matric/ID) */}
          <div className="space-y-2">
            <Label htmlFor="identifier">
              Matric / Employee ID {isRequired("identifier") && "*"}
            </Label>
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

          {/* Role */}
          <div className="space-y-2">
            <Label>
              Role {isRequired("role") && "*"}
            </Label>
            <Select
              value={roleValue}
              onValueChange={(value: ParticipantRole) => setValue("role", value)}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {PARTICIPANT_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          {/* Quote */}
          <div className="space-y-2">
            <Label htmlFor="quote">
              Quote / Motto {isRequired("quote") && "*"}
            </Label>
            <div className="relative">
              <Quote className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Textarea
                id="quote"
                placeholder="Your favorite quote or motto (max 200 characters)"
                {...register("quote")}
                className="pl-11 min-h-[80px] resize-none"
                maxLength={200}
              />
            </div>
            {errors.quote && (
              <p className="text-sm text-destructive">{errors.quote.message}</p>
            )}
          </div>
        </div>

        {/* Background Color Selection */}
        <BackgroundColorPicker
          value={backgroundColor}
          onChange={onBackgroundColorChange}
        />

        {/* Upload Progress */}
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Uploading...</span>
              <span className="font-medium text-foreground">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </motion.div>
        )}

        {/* Error */}
        {error && (
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
                  {error.message}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Payment notice */}
        {requiresPayment && pricePerParticipant && (
          <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
            <p className="text-sm text-foreground">
              <strong>Note:</strong> After submission, you'll be asked to pay ${pricePerParticipant} to complete your entry.
            </p>
          </div>
        )}

        <Button 
          type="submit" 
          variant="accent" 
          size="lg" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
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
  );
}
