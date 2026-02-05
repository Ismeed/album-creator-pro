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
import { 
  ArrowLeft, 
  Image, 
  Calendar, 
  Check, 
  Loader2, 
  Building2,
  Settings2,
  Layout
} from "lucide-react";
import { useCreateAlbum } from "@/hooks/useAlbums";
import { useToast } from "@/hooks/use-toast";
import { SchemaConfigurator } from "@/components/album/SchemaConfigurator";
import { TemplateSelector } from "@/components/album/TemplateSelector";
import { CustomFieldsEditor } from "@/components/album/CustomFieldsEditor";
import {
  type AlbumCategory,
  type StoredSchemaConfig,
  ALBUM_CATEGORIES,
  createDefaultSchemaConfig,
} from "@/types/field-schemas";
import { type CustomField } from "@/types/album-templates";
import type { Database } from "@/integrations/supabase/types";

type PaymentMode = Database["public"]["Enums"]["payment_mode"];

const formSchema = z.object({
  title: z.string().min(1, "Album title is required").max(200, "Title is too long"),
  institution_name: z.string().min(1, "Institution name is required").max(200, "Name is too long"),
  album_type: z.enum(["class", "department", "faculty", "training", "bootcamp", "other"] as const),
  submission_deadline: z.string().optional(),
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
  
  // Template selection state
  const [selectedTemplateId, setSelectedTemplateId] = useState("foundation");
  
  // Schema configuration state
  const [schemaConfig, setSchemaConfig] = useState<StoredSchemaConfig>(
    createDefaultSchemaConfig("class")
  );
  const [departments, setDepartments] = useState<string[]>([]);
  
  // Custom fields state (max 3)
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

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
      submission_deadline: "",
    },
  });

  const albumType = watch("album_type");
  const formValues = watch();

  // Update schema when album type changes
  const handleAlbumTypeChange = (value: AlbumCategory) => {
    setValue("album_type", value);
    setSchemaConfig(createDefaultSchemaConfig(value));
    // Reset departments when switching away from faculty
    if (value !== "faculty") {
      setDepartments([]);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (step < 4) {
      if (step === 1) {
        const isValid = await trigger(["title", "institution_name", "album_type"]);
        if (isValid) {
          setStep(2);
        }
      } else if (step === 2) {
        // Template selection - always proceed
        setStep(3);
      } else if (step === 3) {
        // Validate faculty has at least one department
        if (data.album_type === "faculty" && departments.length === 0) {
          toast({
            title: "Departments Required",
            description: "Please add at least one department for this faculty album.",
            variant: "destructive",
          });
          return;
        }
        setStep(4);
      }
      return;
    }

    try {
      // Build the stored config with departments if applicable
      const finalConfig: StoredSchemaConfig = {
        ...schemaConfig,
        ...(departments.length > 0 && { departments }),
        ...(customFields.length > 0 && { customFields: customFields.map(f => ({ label: f.label, required: false })) }),
      };

      const album = await createAlbum.mutateAsync({
        title: data.title,
        institution_name: data.institution_name,
        album_type: data.album_type,
        payment_mode: "organizer_pays" as PaymentMode, // Payments disabled for MVP
        price_per_participant: null,
        submission_deadline: data.submission_deadline || null,
        required_fields: finalConfig as unknown as Database["public"]["Tables"]["albums"]["Insert"]["required_fields"],
        // @ts-ignore - template_id and custom_fields added via migration
        template_id: selectedTemplateId,
        custom_fields: customFields.length > 0 ? customFields.map(f => ({ id: f.id, label: f.label })) : null,
      } as any);

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
  const canProceedStep2 = true; // Template selection is always valid once selected
  const canProceedStep3 = albumType !== "faculty" || departments.length > 0;

  const selectedCategory = ALBUM_CATEGORIES.find(c => c.value === albumType);

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
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-accent" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Step {step} of 4: {
            step === 1 ? "Basic Info" : 
            step === 2 ? "Template Selection" :
            step === 3 ? "Field Configuration" : 
            "Deadline & Review"
          }
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="mobile-container pb-8">
        {/* Step 1: Basic Info */}
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
              <Label>Album Category *</Label>
              <Select
                value={albumType}
                onValueChange={handleAlbumTypeChange}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select album category" />
                </SelectTrigger>
                <SelectContent>
                  {ALBUM_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex flex-col items-start">
                        <span>{cat.label}</span>
                        <span className="text-xs text-muted-foreground">{cat.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategory && (
                <p className="text-xs text-muted-foreground">
                  Uses Schema {selectedCategory.schemaType}: {selectedCategory.description}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 2: Template Selection */}
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
                <Layout className="w-8 h-8 text-accent-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Choose Template
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Select an album design template
              </p>
            </div>

            <TemplateSelector
              selectedTemplateId={selectedTemplateId}
              onSelect={setSelectedTemplateId}
            />

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Template cannot be changed after participants start submitting.
              </p>
            </div>
          </motion.div>
        )}

        {/* Step 3: Schema Configuration */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center mx-auto mb-4">
                <Settings2 className="w-8 h-8 text-accent-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Field Configuration
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Customize the participant form fields
              </p>
            </div>

            <SchemaConfigurator
              category={albumType}
              config={schemaConfig}
              onChange={setSchemaConfig}
              departments={departments}
              onDepartmentsChange={albumType === "faculty" ? setDepartments : undefined}
            />

            {/* Custom Fields Section */}
            <div className="border-t border-border pt-6">
              <CustomFieldsEditor
                customFields={customFields}
                onChange={setCustomFields}
              />
            </div>
          </motion.div>
        )}

        {/* Step 4: Deadline & Review */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-accent-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Deadline & Review
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Set deadline and review your album settings
              </p>
            </div>

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
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium text-foreground">
                    {selectedCategory?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Template</span>
                  <span className="font-medium text-foreground capitalize">
                    {selectedTemplateId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Schema</span>
                  <span className="font-medium text-foreground">
                    Type {schemaConfig.schemaType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fields</span>
                  <span className="font-medium text-foreground">
                    {schemaConfig.fields.filter(f => f.required).length} required, {schemaConfig.fields.filter(f => !f.required).length} optional
                  </span>
                </div>
                {customFields.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custom Fields</span>
                    <span className="font-medium text-foreground">
                      {customFields.length} defined
                    </span>
                  </div>
                )}
                {departments.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Departments</span>
                    <span className="font-medium text-foreground">
                      {departments.length} defined
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

            {/* Testing mode notice */}
            <div className="rounded-lg bg-accent/10 border border-accent/20 p-3">
              <p className="text-xs text-accent-foreground">
                <strong>Testing Mode:</strong> Payments are disabled. 
                Album generation is free during the testing phase.
              </p>
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
              (step === 3 && !canProceedStep3) ||
              createAlbum.isPending
            }
          >
            {createAlbum.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating...
              </>
            ) : step === 4 ? (
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