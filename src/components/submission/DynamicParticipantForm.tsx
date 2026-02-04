import { useMemo } from "react";
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
  ArrowLeft,
  Mail,
  Briefcase
} from "lucide-react";
import {
  type FieldConfig,
  type FieldId,
  type StoredSchemaConfig,
  parseSchemaConfig,
  getFieldsForRendering,
  FIELD_SCHEMAS,
} from "@/types/field-schemas";

// Icon mapping for fields
const FIELD_ICONS: Record<FieldId, React.ComponentType<{ className?: string }>> = {
  full_name: User,
  email: Mail,
  department_or_class: Building2,
  identifier: Hash,
  graduation_year: GraduationCap,
  role: Briefcase,
  quote: Quote,
  cohort: Users,
};

// Create dynamic Zod schema from field config
function createDynamicSchema(fields: FieldConfig[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  
  for (const field of fields) {
    let fieldSchema: z.ZodTypeAny;
    
    if (field.type === "textarea") {
      fieldSchema = z.string().trim().max(field.maxLength || 200, `Must be under ${field.maxLength || 200} characters`);
    } else if (field.type === "year") {
      fieldSchema = z.string().regex(/^\d{4}(\/\d{4})?$/, "Use format: 2025 or 2024/2025").or(z.literal(""));
    } else if (field.type === "select" && field.options) {
      const values = field.options.map(o => o.value) as [string, ...string[]];
      fieldSchema = z.enum(values).or(z.literal(""));
    } else {
      fieldSchema = z.string().trim().max(field.maxLength || 100, `Too long`);
    }
    
    if (field.required) {
      if (field.id === "email") {
        fieldSchema = z.string().trim().email("Please enter a valid email address");
      } else {
        fieldSchema = z.string().trim().min(1, `${field.label} is required`).max(field.maxLength || 100, "Too long");
      }
    } else {
      fieldSchema = fieldSchema.optional().or(z.literal(""));
    }
    
    shape[field.id] = fieldSchema;
  }
  
  // Always add confirmEmail for email validation
  shape["confirmEmail"] = z.string().trim().email("Please confirm your email address");
  
  return z.object(shape).refine((data) => {
    return data.email === data.confirmEmail;
  }, {
    message: "Email addresses do not match",
    path: ["confirmEmail"],
  });
}

export type DynamicFormData = Record<string, string | undefined>;

interface DynamicParticipantFormProps {
  schemaConfig: StoredSchemaConfig;
  previewUrl: string;
  onSubmit: (data: DynamicFormData) => void;
  onBack: () => void;
  isSubmitting: boolean;
  uploadProgress: number;
  error: Error | null;
  departments?: string[]; // For faculty albums with department selection
}

export function DynamicParticipantForm({
  schemaConfig,
  previewUrl,
  onSubmit,
  onBack,
  isSubmitting,
  uploadProgress,
  error,
  departments,
}: DynamicParticipantFormProps) {
  // Get fields for rendering
  const fields = useMemo(() => {
    return getFieldsForRendering(schemaConfig);
  }, [schemaConfig]);
  
  // Create dynamic schema
  const formSchema = useMemo(() => {
    return createDynamicSchema(fields);
  }, [fields]);
  
  // Default values
  const defaultValues = useMemo(() => {
    const values: Record<string, string> = { confirmEmail: "" };
    for (const field of fields) {
      values[field.id] = "";
    }
    return values;
  }, [fields]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DynamicFormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues,
  });

  // Render a single field
  const renderField = (field: FieldConfig) => {
    const Icon = FIELD_ICONS[field.id] || User;
    const fieldError = errors[field.id];
    const value = watch(field.id);
    
    // Special handling for department field in faculty albums
    if (field.id === "department_or_class" && departments && departments.length > 0) {
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id}>
            {field.label} {field.required && "*"}
          </Label>
          <Select
            value={value || ""}
            onValueChange={(v) => setValue(field.id, v)}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldError && (
            <p className="text-sm text-destructive">{String(fieldError.message)}</p>
          )}
        </div>
      );
    }
    
    // Select field
    if (field.type === "select" && field.options) {
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id}>
            {field.label} {field.required && "*"}
          </Label>
          <Select
            value={value || ""}
            onValueChange={(v) => setValue(field.id, v)}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldError && (
            <p className="text-sm text-destructive">{String(fieldError.message)}</p>
          )}
        </div>
      );
    }
    
    // Textarea field
    if (field.type === "textarea") {
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id}>
            {field.label} {field.required && "*"}
          </Label>
          <div className="relative">
            <Icon className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              {...register(field.id)}
              className="pl-11 min-h-[80px] resize-none"
              maxLength={field.maxLength}
            />
          </div>
          {fieldError && (
            <p className="text-sm text-destructive">{String(fieldError.message)}</p>
          )}
        </div>
      );
    }
    
    // Text/email/year input
    return (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={field.id}>
          {field.label} {field.required && "*"}
        </Label>
        <div className="relative">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            id={field.id}
            type={field.id === "email" ? "email" : "text"}
            placeholder={field.placeholder}
            {...register(field.id)}
            className="pl-11 h-12"
          />
        </div>
        {fieldError && (
          <p className="text-sm text-destructive">{String(fieldError.message)}</p>
        )}
        {field.id === "email" && (
          <p className="text-xs text-muted-foreground">
            We'll send a confirmation with an edit link
          </p>
        )}
      </div>
    );
  };

  // Find email field index to add confirmEmail right after
  const emailFieldIndex = fields.findIndex(f => f.id === "email");

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
          {fields.map((field, index) => (
            <div key={field.id}>
              {renderField(field)}
              {/* Add confirm email right after email field */}
              {index === emailFieldIndex && (
                <div className="space-y-2 mt-4">
                  <Label htmlFor="confirmEmail">Confirm Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirmEmail"
                      type="email"
                      placeholder="Confirm your email address"
                      {...register("confirmEmail")}
                      className="pl-11 h-12"
                    />
                  </div>
                  {errors.confirmEmail && (
                    <p className="text-sm text-destructive">{String(errors.confirmEmail.message)}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

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
