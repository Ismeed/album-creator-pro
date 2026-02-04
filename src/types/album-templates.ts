import type { SubmissionWithParticipant } from "@/hooks/useSubmissions";
import type { AlbumWithStats } from "@/hooks/useAlbums";
import { parseSchemaConfig, type StoredSchemaConfig, type SchemaType } from "@/types/field-schemas";

// Template configuration
export interface AlbumTemplateConfig {
  id: string;
  name: string;
  description: string;
  previewImage?: string;
}

// Available templates
export const ALBUM_TEMPLATES: AlbumTemplateConfig[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Clean, professional layout with centered photos and elegant typography",
  },
  {
    id: "modern",
    name: "Modern Grid",
    description: "Contemporary design with grid-based layout and bold headers",
  },
];

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
}

// Full album data for template rendering
export interface AlbumTemplateData {
  cover: CoverPageData;
  participants: ParticipantEntry[];
  templateId: string;
  generatedAt: string;
  schemaConfig?: StoredSchemaConfig;
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

// Transform raw data to template-ready format
export function prepareAlbumTemplateData(
  album: AlbumWithStats,
  submissions: SubmissionWithParticipant[],
  templateId: string = "classic"
): AlbumTemplateData {
  // Parse schema config from album
  const schemaConfig = parseSchemaConfig(album.required_fields);
  
  // Filter for approved submissions only
  // Payments are disabled for testing, so we accept all payment statuses
  const eligibleSubmissions = submissions.filter((sub) => {
    const isApproved = sub.approval_status === "approved";
    // Payment check disabled for MVP testing
    // const isPaid = album.payment_mode === "organizer_pays" || sub.payment_status === "successful";
    return isApproved;
  });

  // Sort by participant name
  const sortedSubmissions = [...eligibleSubmissions].sort((a, b) => {
    const nameA = a.participant?.full_name || "";
    const nameB = b.participant?.full_name || "";
    return nameA.localeCompare(nameB);
  });

  // Transform to participant entries with all fields
  const participants: ParticipantEntry[] = sortedSubmissions.map((sub) => ({
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
  }));

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
    templateId,
    generatedAt: new Date().toISOString(),
    schemaConfig: schemaConfig || undefined,
  };
}
