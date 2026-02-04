import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  AlertCircle, 
  Check, 
  User, 
  Building2, 
  Hash, 
  GraduationCap, 
  Users, 
  Quote,
  Lock,
  Mail,
  Edit3
} from "lucide-react";

const PARTICIPANT_ROLES = [
  { value: "graduate", label: "Graduate" },
  { value: "participant", label: "Participant" },
  { value: "facilitator", label: "Facilitator" },
  { value: "instructor", label: "Instructor" },
  { value: "mentor", label: "Mentor" },
  { value: "other", label: "Other" },
] as const;

type ParticipantRole = typeof PARTICIPANT_ROLES[number]["value"];

const formSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().trim().email("Please enter a valid email address"),
  confirmEmail: z.string().trim().email("Please confirm your email address"),
  departmentOrClass: z.string().trim().max(100, "Too long").optional(),
  identifier: z.string().trim().max(50, "Too long").optional(),
  graduationYear: z.string().regex(/^\d{4}(\/\d{4})?$/, "Use format: 2025 or 2024/2025").optional().or(z.literal("")),
  role: z.enum(["graduate", "participant", "facilitator", "instructor", "mentor", "other"]).optional(),
  quote: z.string().trim().max(200, "Quote must be under 200 characters").optional(),
  cohort: z.string().trim().max(100, "Too long").optional(),
}).refine((data) => data.email === data.confirmEmail, {
  message: "Email addresses do not match",
  path: ["confirmEmail"],
});

type FormData = z.infer<typeof formSchema>;

interface SubmissionData {
  id: string;
  albumId: string;
  photoUrl: string | null;
  backgroundColor: string | null;
  isEdited: boolean;
  approvalStatus: string;
  submittedAt: string;
  participant: {
    id: string;
    full_name: string;
    email: string | null;
    department_or_class: string | null;
    identifier: string | null;
    graduation_year: string | null;
    role: string | null;
    quote: string | null;
    cohort: string | null;
  };
}

const EditSubmissionPage = () => {
  const { token } = useParams<{ token: string }>();
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  // Fetch submission data
  const { data, isLoading, error } = useQuery({
    queryKey: ["edit-submission", token],
    queryFn: async () => {
      if (!supabaseUrl || !apiKey) {
        throw new Error("Missing required configuration");
      }
      const response = await fetch(
        `${supabaseUrl}/functions/v1/get-submission-by-token?token=${encodeURIComponent(token || "")}`,
        {
          headers: { apikey: apiKey },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load submission");
      }

      return response.json();
    },
    enabled: !!token && !!supabaseUrl && !!apiKey,
  });

  const submission: SubmissionData | null = data?.submission || null;
  const album = data?.album;
  const isEditable = data?.isEditable ?? false;
  const editDisabledReason = data?.editDisabledReason;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      confirmEmail: "",
      departmentOrClass: "",
      identifier: "",
      graduationYear: "",
      role: "participant",
      quote: "",
      cohort: "",
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (submission?.participant) {
      const p = submission.participant;
      form.reset({
        fullName: p.full_name || "",
        email: p.email || "",
        confirmEmail: p.email || "",
        departmentOrClass: p.department_or_class || "",
        identifier: p.identifier || "",
        graduationYear: p.graduation_year || "",
        role: (p.role as ParticipantRole) || "participant",
        quote: p.quote || "",
        cohort: p.cohort || "",
      });
    }
  }, [submission, form]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!supabaseUrl || !apiKey) {
        throw new Error("Missing required configuration");
      }
      const response = await fetch(`${supabaseUrl}/functions/v1/update-submission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify({
          editToken: token,
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update submission");
      }

      return response.json();
    },
    onSuccess: () => {
      setUpdateSuccess(true);
    },
  });

  const handleSubmit = (formData: FormData) => {
    updateMutation.mutate(formData);
  };

  // Check for missing configuration after all hooks
  if (!supabaseUrl || !apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Configuration Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Missing required configuration. Please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }


  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-[100dvh] bg-background safe-top safe-bottom flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </main>
    );
  }

  // Error state
  if (error || !submission) {
    return (
      <main className="min-h-[100dvh] bg-background safe-top safe-bottom">
        <div className="mobile-container py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Cannot Load Submission</h1>
          <p className="text-muted-foreground max-w-xs mx-auto">
            {(error as Error)?.message || "The edit link may be invalid or expired."}
          </p>
        </div>
      </main>
    );
  }

  // Success state
  if (updateSuccess) {
    return (
      <main className="min-h-[100dvh] bg-background safe-top safe-bottom">
        <header className="bg-primary text-primary-foreground py-6">
          <div className="mobile-container text-center">
            <span className="text-accent font-bold text-lg">OLEX</span>
            <h1 className="text-xl font-bold mt-2">{album?.title}</h1>
          </div>
        </header>

        <div className="mobile-container py-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
            className="w-20 h-20 rounded-full bg-success flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-10 h-10 text-success-foreground" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Submission Updated!
          </h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Your changes have been saved. The organizer will be notified that your submission was edited.
          </p>
        </div>
      </main>
    );
  }

  // Editing disabled state
  if (!isEditable) {
    return (
      <main className="min-h-[100dvh] bg-background safe-top safe-bottom">
        <header className="bg-primary text-primary-foreground py-6">
          <div className="mobile-container text-center">
            <span className="text-accent font-bold text-lg">OLEX</span>
            <h1 className="text-xl font-bold mt-2">{album?.title}</h1>
          </div>
        </header>

        <div className="mobile-container py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Editing Not Available
          </h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            {editDisabledReason || "Editing is no longer available for this album."}
          </p>

          {/* Show current submission info */}
          {submission.photoUrl && (
            <div className="mt-8">
              <div className="aspect-[3/4] max-w-[150px] mx-auto rounded-xl overflow-hidden shadow-card">
                <img 
                  src={submission.photoUrl} 
                  alt="Your submitted photo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {submission.participant.full_name}
              </p>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Edit form
  return (
    <main className="min-h-[100dvh] bg-background safe-top safe-bottom">
      <header className="bg-primary text-primary-foreground py-6">
        <div className="mobile-container text-center">
          <span className="text-accent font-bold text-lg">OLEX</span>
          <h1 className="text-xl font-bold mt-2">{album?.title}</h1>
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary-foreground/60 bg-primary-foreground/10 px-3 py-1 rounded-full">
            <Edit3 className="w-3 h-3" />
            <span>Edit Your Submission</span>
          </div>
        </div>
      </header>

      <div className="mobile-container py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Photo preview */}
          {submission.photoUrl && (
            <div className="relative aspect-[3/4] max-w-[160px] mx-auto rounded-xl overflow-hidden shadow-card mb-6">
              <img 
                src={submission.photoUrl} 
                alt="Your photo" 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {submission.isEdited && (
            <div className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/20 text-center">
              <p className="text-xs text-accent">
                This submission has been edited before
              </p>
            </div>
          )}

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="fullName"
                  placeholder="Your full name"
                  {...form.register("fullName")}
                  className="pl-11 h-12"
                />
              </div>
              {form.formState.errors.fullName && (
                <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  {...form.register("email")}
                  className="pl-11 h-12"
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* Confirm Email */}
            <div className="space-y-2">
              <Label htmlFor="confirmEmail">Confirm Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmEmail"
                  type="email"
                  placeholder="Confirm your email address"
                  {...form.register("confirmEmail")}
                  className="pl-11 h-12"
                />
              </div>
              {form.formState.errors.confirmEmail && (
                <p className="text-sm text-destructive">{form.formState.errors.confirmEmail.message}</p>
              )}
            </div>

            {/* Department/Class */}
            <div className="space-y-2">
              <Label htmlFor="departmentOrClass">Department / Class</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="departmentOrClass"
                  placeholder="e.g., Computer Science"
                  {...form.register("departmentOrClass")}
                  className="pl-11 h-12"
                />
              </div>
            </div>

            {/* Cohort */}
            <div className="space-y-2">
              <Label htmlFor="cohort">Class / Cohort</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="cohort"
                  placeholder="e.g., Cohort 5, Class of 2025"
                  {...form.register("cohort")}
                  className="pl-11 h-12"
                />
              </div>
            </div>

            {/* Graduation Year */}
            <div className="space-y-2">
              <Label htmlFor="graduationYear">Graduation / Program Year</Label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="graduationYear"
                  placeholder="e.g., 2025 or 2024/2025"
                  {...form.register("graduationYear")}
                  className="pl-11 h-12"
                />
              </div>
            </div>

            {/* Identifier */}
            <div className="space-y-2">
              <Label htmlFor="identifier">Matric / Employee ID</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="identifier"
                  placeholder="e.g., 2025/CS/001"
                  {...form.register("identifier")}
                  className="pl-11 h-12"
                />
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.watch("role")}
                onValueChange={(value: ParticipantRole) => form.setValue("role", value)}
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
            </div>

            {/* Quote */}
            <div className="space-y-2">
              <Label htmlFor="quote">Quote / Motto</Label>
              <div className="relative">
                <Quote className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Textarea
                  id="quote"
                  placeholder="Your favorite quote or motto (max 200 characters)"
                  {...form.register("quote")}
                  className="pl-11 min-h-[80px] resize-none"
                  maxLength={200}
                />
              </div>
            </div>

            {/* Error */}
            {updateMutation.error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                  <div>
                    <p className="font-medium text-destructive">Update Failed</p>
                    <p className="text-sm text-destructive/80 mt-1">
                      {(updateMutation.error as Error).message}
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
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </main>
  );
};

export default EditSubmissionPage;
