import type { SubmissionWithParticipant } from "@/hooks/useSubmissions";
import type { AlbumWithStats } from "@/hooks/useAlbums";
import { parseSchemaConfig, type StoredSchemaConfig, type SchemaType } from "@/types/field-schemas";

// Template tiers
export type TemplateTier = "basic" | "premium";

// Template configuration
export interface AlbumTemplateConfig {
  id: string;
  name: string;
  description: string;
  tier: TemplateTier;
  previewImage?: string;
}

// Template variant type for rendering
export type TemplateVariant = "foundation" | "classic-grid" | "elevate" | "momentum" | "signature";

// Available templates - 5 total (2 basic, 3 premium)
export const ALBUM_TEMPLATES: AlbumTemplateConfig[] = [
  {
    id: "foundation",
    name: "Foundation",
    description: "Minimal layout with centered portraits and clean typography. Best for small classes.",
    tier: "basic",
  },
  {
    id: "classic-grid",
    name: "Classic Grid",
    description: "Grid-based layout with compact photo cards. Optimized for large participant counts.",
    tier: "basic",
  },
  {
    id: "elevate",
    name: "Elevate",
    description: "Editorial ivory, fine borders, and quiet luxury for a timeless collection.",
    tier: "premium",
  },
  {
    id: "momentum",
    name: "Momentum",
    description: "Midnight charcoal, warm gold, and a dramatic private-archive mood.",
    tier: "premium",
  },
  {
    id: "signature",
    name: "Signature",
    description: "Gallery-inspired monochrome pages with museum-grade photo emphasis.",
    tier: "premium",
  },
];

// Get template by ID
export function getTemplateById(templateId: string): AlbumTemplateConfig | undefined {
  return ALBUM_TEMPLATES.find((t) => t.id === templateId);
}

// Custom field definition (max 3 per album)
export interface CustomField {
  id: string;
  label: string;
}

export const MAX_CUSTOM_FIELDS = 3;
export const MAX_CUSTOM_FIELD_LABEL_LENGTH = 50;
export const MAX_CUSTOM_FIELD_VALUE_LENGTH = 100;

// Cover page data
export interface CoverPageData {
  title: string;
  institutionName?: string;
  albumType: string;
  year: string;
  logoUrl?: string;
  schemaType?: SchemaType;
}

// Participant entry for template - extended to support all schema fields
export interface ParticipantEntry {
  id: string;
  fullName: string;
  email?: string;
  departmentOrClass?: string;
  identifier?: string;
  graduationYear?: string;
  role?: string;
  quote?: string;
  cohort?: string;
  photoUrl: string;
  processedPhotoUrl?: string;
  customFieldValues?: Record<string, string>;
}

// Full album data for template rendering
export interface AlbumTemplateData {
  cover: CoverPageData;
  participants: ParticipantEntry[];
  templateId: string;
  generatedAt: string;
  schemaConfig?: StoredSchemaConfig;
  customFields?: CustomField[];
}

// Album type labels for display
export const ALBUM_TYPE_LABELS: Record<string, string> = {
  class: "Class Album",
  department: "Department Album",
  faculty: "Faculty Album",
  training: "Training Album",
  bootcamp: "Bootcamp Album",
  other: "Album",
};

// Get display label for a field based on schema config
export function getFieldLabel(
  fieldId: string, 
  schemaConfig?: StoredSchemaConfig
): string {
  if (schemaConfig) {
    const field = schemaConfig.fields.find(f => f.id === fieldId);
    if (field) return field.label;
  }
  
  // Default labels
  const defaults: Record<string, string> = {
    full_name: "Name",
    email: "Email",
    department_or_class: "Department / Class",
    identifier: "ID",
    graduation_year: "Year",
    role: "Role",
    quote: "Quote",
    cohort: "Cohort",
  };
  
  return defaults[fieldId] || fieldId;
}

// Get fields to display in album based on schema
export function getDisplayFields(schemaConfig?: StoredSchemaConfig): string[] {
  if (!schemaConfig) {
    // Default display fields
    return ["departmentOrClass", "identifier"];
  }
  
  // Return field IDs that should be displayed (excluding email which is for communication only)
  return schemaConfig.fields
    .filter(f => f.id !== "email" && f.id !== "full_name")
    .map(f => {
      // Map snake_case to camelCase for template usage
      const mapping: Record<string, string> = {
        department_or_class: "departmentOrClass",
        graduation_year: "graduationYear",
        identifier: "identifier",
        role: "role",
        quote: "quote",
        cohort: "cohort",
      };
      return mapping[f.id] || f.id;
    });
}

// Parse custom fields from JSON
export function parseCustomFields(customFieldsJson: unknown): CustomField[] {
  if (!customFieldsJson || !Array.isArray(customFieldsJson)) return [];
  
  return customFieldsJson
    .filter((f): f is { id: string; label: string } => 
      typeof f === "object" && 
      f !== null && 
      typeof f.id === "string" && 
      typeof f.label === "string"
    )
    .slice(0, MAX_CUSTOM_FIELDS);
}

// Transform raw data to template-ready format
export function prepareAlbumTemplateData(
  album: AlbumWithStats & { template_id?: string; custom_fields?: unknown },
  submissions: SubmissionWithParticipant[],
  templateId?: string
): AlbumTemplateData {
  // Parse schema config from album
  const schemaConfig = parseSchemaConfig(album.required_fields);
  const customFields = parseCustomFields(album.custom_fields);
  const finalTemplateId = templateId || album.template_id || "classic";
  
  // Filter for approved submissions only
  // Payments are disabled for testing, so we accept all payment statuses
  const eligibleSubmissions = submissions.filter((sub) => {
    const isApproved = sub.approval_status === "approved";
    return isApproved;
  });

  // Sort by participant name
  const sortedSubmissions = [...eligibleSubmissions].sort((a, b) => {
    const nameA = a.participant?.full_name || "";
    const nameB = b.participant?.full_name || "";
    return nameA.localeCompare(nameB);
  });

  // Transform to participant entries with all fields
  const participants: ParticipantEntry[] = sortedSubmissions.map((sub) => {
    // Parse custom field values if present
    let customFieldValues: Record<string, string> | undefined;
    const rawCustomValues = (sub.participant as any)?.custom_field_values;
    if (rawCustomValues && typeof rawCustomValues === "object") {
      customFieldValues = rawCustomValues;
    }
    
    return {
      id: sub.id,
      fullName: sub.participant?.full_name || "Unknown",
      email: sub.participant?.email || undefined,
      departmentOrClass: sub.participant?.department_or_class || undefined,
      identifier: sub.participant?.identifier || undefined,
      graduationYear: sub.participant?.graduation_year || undefined,
      role: sub.participant?.role || undefined,
      quote: sub.participant?.quote || undefined,
      cohort: sub.participant?.cohort || undefined,
      photoUrl: sub.photo_url,
      processedPhotoUrl: sub.processed_photo_url || undefined,
      customFieldValues,
    };
  });

  // Prepare cover data
  const currentYear = new Date().getFullYear().toString();
  const cover: CoverPageData = {
    title: album.title,
    institutionName: album.institution_name || undefined,
    albumType: ALBUM_TYPE_LABELS[album.album_type] || "Album",
    year: currentYear,
    schemaType: schemaConfig?.schemaType,
  };

  return {
    cover,
    participants,
    templateId: finalTemplateId,
    generatedAt: new Date().toISOString(),
    schemaConfig: schemaConfig || undefined,
    customFields: customFields.length > 0 ? customFields : undefined,
  };
}
