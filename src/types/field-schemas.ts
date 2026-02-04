/**
 * Field Schema System for Album Types
 * 
 * Schemas control:
 * - Participant form fields
 * - Required/optional inputs
 * - Album generation layout
 */

import type { Database } from "@/integrations/supabase/types";

export type AlbumCategory = Database["public"]["Enums"]["album_type"];

// Field IDs that can appear in participant forms
export type FieldId = 
  | "full_name"
  | "email"
  | "department_or_class"
  | "identifier"
  | "graduation_year"
  | "role"
  | "quote"
  | "cohort";

// Schema types
export type SchemaType = "A" | "B" | "C" | "D";

// Field configuration
export interface FieldConfig {
  id: FieldId;
  label: string;
  placeholder: string;
  required: boolean;
  type: "text" | "select" | "textarea" | "year";
  maxLength?: number;
  options?: { value: string; label: string }[];
}

// Schema definition
export interface FieldSchema {
  id: SchemaType;
  name: string;
  description: string;
  fields: FieldConfig[];
}

// Roles for role field
export const ROLE_OPTIONS = [
  { value: "graduate", label: "Graduate" },
  { value: "participant", label: "Participant" },
  { value: "facilitator", label: "Facilitator" },
  { value: "instructor", label: "Instructor" },
  { value: "mentor", label: "Mentor" },
  { value: "prefect", label: "Prefect" },
  { value: "other", label: "Other" },
] as const;

// ==============================================
// SCHEMA A - Academic Class (Primary/Secondary)
// ==============================================
export const SCHEMA_A: FieldSchema = {
  id: "A",
  name: "Academic Class",
  description: "For primary/secondary school classes and graduation classes",
  fields: [
    {
      id: "full_name",
      label: "Full Name",
      placeholder: "Your full name",
      required: true,
      type: "text",
      maxLength: 100,
    },
    {
      id: "email",
      label: "Email Address",
      placeholder: "your.email@example.com",
      required: true,
      type: "text",
      maxLength: 255,
    },
    {
      id: "department_or_class",
      label: "Class",
      placeholder: "e.g., SS3 Science, Grade 12A",
      required: true,
      type: "text",
      maxLength: 100,
    },
    {
      id: "graduation_year",
      label: "Academic Session / Year",
      placeholder: "e.g., 2024/2025",
      required: true,
      type: "year",
      maxLength: 20,
    },
    {
      id: "role",
      label: "Role / Title",
      placeholder: "Select your role",
      required: false,
      type: "select",
      options: [
        { value: "graduate", label: "Graduate" },
        { value: "prefect", label: "Prefect" },
        { value: "class_rep", label: "Class Representative" },
        { value: "other", label: "Other" },
      ],
    },
  ],
};

// ==============================================
// SCHEMA B - Department / Faculty (Higher Institution)
// ==============================================
export const SCHEMA_B: FieldSchema = {
  id: "B",
  name: "Department / Faculty",
  description: "For department and faculty albums at higher institutions",
  fields: [
    {
      id: "full_name",
      label: "Full Name",
      placeholder: "Your full name",
      required: true,
      type: "text",
      maxLength: 100,
    },
    {
      id: "email",
      label: "Email Address",
      placeholder: "your.email@example.com",
      required: true,
      type: "text",
      maxLength: 255,
    },
    {
      id: "department_or_class",
      label: "Department",
      placeholder: "e.g., Computer Science",
      required: true,
      type: "text", // Will be "select" when departments are defined
      maxLength: 100,
    },
    {
      id: "identifier",
      label: "Matric / Registration Number",
      placeholder: "e.g., 2020/CS/001",
      required: false,
      type: "text",
      maxLength: 50,
    },
    {
      id: "graduation_year",
      label: "Graduation Year",
      placeholder: "e.g., 2025",
      required: false,
      type: "year",
      maxLength: 10,
    },
  ],
};

// ==============================================
// SCHEMA C - Training / Bootcamp / Program
// ==============================================
export const SCHEMA_C: FieldSchema = {
  id: "C",
  name: "Training / Program",
  description: "For trainings, bootcamps, workshops, and fellowship programs",
  fields: [
    {
      id: "full_name",
      label: "Full Name",
      placeholder: "Your full name",
      required: true,
      type: "text",
      maxLength: 100,
    },
    {
      id: "email",
      label: "Email Address",
      placeholder: "your.email@example.com",
      required: true,
      type: "text",
      maxLength: 255,
    },
    {
      id: "cohort",
      label: "Program / Training Name",
      placeholder: "e.g., Data Science Bootcamp",
      required: true,
      type: "text",
      maxLength: 100,
    },
    {
      id: "role",
      label: "Track / Role",
      placeholder: "e.g., Frontend Developer, Facilitator",
      required: true,
      type: "text",
      maxLength: 100,
    },
    {
      id: "graduation_year",
      label: "Completion Year",
      placeholder: "e.g., 2025",
      required: true,
      type: "year",
      maxLength: 10,
    },
  ],
};

// ==============================================
// SCHEMA D - Custom (Other)
// ==============================================
export const SCHEMA_D: FieldSchema = {
  id: "D",
  name: "Custom",
  description: "For NGOs, associations, and special events with custom fields",
  fields: [
    {
      id: "full_name",
      label: "Full Name",
      placeholder: "Your full name",
      required: true,
      type: "text",
      maxLength: 100,
    },
    {
      id: "email",
      label: "Email Address",
      placeholder: "your.email@example.com",
      required: true,
      type: "text",
      maxLength: 255,
    },
    {
      id: "department_or_class",
      label: "Group / Category",
      placeholder: "e.g., Board Members, Volunteers",
      required: false,
      type: "text",
      maxLength: 100,
    },
    {
      id: "role",
      label: "Role / Title",
      placeholder: "e.g., President, Member",
      required: false,
      type: "text",
      maxLength: 100,
    },
    {
      id: "quote",
      label: "Quote / Motto",
      placeholder: "Your favorite quote (optional)",
      required: false,
      type: "textarea",
      maxLength: 200,
    },
  ],
};

// All schemas
export const FIELD_SCHEMAS: Record<SchemaType, FieldSchema> = {
  A: SCHEMA_A,
  B: SCHEMA_B,
  C: SCHEMA_C,
  D: SCHEMA_D,
};

// Category to Schema mapping
export const CATEGORY_TO_SCHEMA: Record<AlbumCategory, SchemaType> = {
  class: "A",
  department: "B",
  faculty: "B",
  training: "C",
  bootcamp: "C",
  other: "D",
};

// Get schema for an album category
export function getSchemaForCategory(category: AlbumCategory): FieldSchema {
  const schemaType = CATEGORY_TO_SCHEMA[category];
  return FIELD_SCHEMAS[schemaType];
}

// Album category display info
export const ALBUM_CATEGORIES: { 
  value: AlbumCategory; 
  label: string; 
  description: string;
  schemaType: SchemaType;
}[] = [
  { 
    value: "class", 
    label: "Class (Primary / Secondary)", 
    description: "For school graduation classes",
    schemaType: "A",
  },
  { 
    value: "department", 
    label: "Department", 
    description: "For university department albums",
    schemaType: "B",
  },
  { 
    value: "faculty", 
    label: "Faculty", 
    description: "For entire faculty albums with multiple departments",
    schemaType: "B",
  },
  { 
    value: "training", 
    label: "Training", 
    description: "For training programs and workshops",
    schemaType: "C",
  },
  { 
    value: "bootcamp", 
    label: "Bootcamp", 
    description: "For bootcamps and intensive programs",
    schemaType: "C",
  },
  { 
    value: "other", 
    label: "Other", 
    description: "For NGOs, associations, and special events",
    schemaType: "D",
  },
];

// Stored schema configuration in albums.required_fields
export interface StoredSchemaConfig {
  schemaType: SchemaType;
  fields: {
    id: FieldId;
    label: string;
    required: boolean;
  }[];
  // For faculty albums: list of departments
  departments?: string[];
  // For custom schemas: additional custom fields
  customFields?: {
    label: string;
    required: boolean;
  }[];
}

// Create default schema config for a category
export function createDefaultSchemaConfig(category: AlbumCategory): StoredSchemaConfig {
  const schema = getSchemaForCategory(category);
  return {
    schemaType: schema.id,
    fields: schema.fields.map(f => ({
      id: f.id,
      label: f.label,
      required: f.required,
    })),
  };
}

// Merge stored config with schema defaults for rendering
export function getFieldsForRendering(config: StoredSchemaConfig): FieldConfig[] {
  const baseSchema = FIELD_SCHEMAS[config.schemaType];
  
  return config.fields.map(storedField => {
    const baseField = baseSchema.fields.find(f => f.id === storedField.id);
    if (!baseField) {
      // Custom field (for Schema D)
      return {
        id: storedField.id,
        label: storedField.label,
        placeholder: `Enter ${storedField.label.toLowerCase()}`,
        required: storedField.required,
        type: "text" as const,
        maxLength: 100,
      };
    }
    
    return {
      ...baseField,
      label: storedField.label, // Allow custom labels
      required: storedField.required, // Allow toggling optional fields
    };
  });
}

// Parse stored required_fields JSON from database
export function parseSchemaConfig(requiredFields: unknown): StoredSchemaConfig | null {
  if (!requiredFields) return null;
  
  // Handle legacy format (array of field IDs)
  if (Array.isArray(requiredFields)) {
    return {
      schemaType: "B", // Default legacy to Schema B
      fields: [
        { id: "full_name", label: "Full Name", required: true },
        { id: "email", label: "Email Address", required: true },
        ...requiredFields
          .filter((id): id is FieldId => typeof id === "string" && id !== "full_name")
          .map(id => ({
            id,
            label: getDefaultLabel(id),
            required: true,
          })),
      ],
    };
  }
  
  // Handle new format
  if (typeof requiredFields === "object" && requiredFields !== null) {
    const config = requiredFields as StoredSchemaConfig;
    if (config.schemaType && config.fields) {
      return config;
    }
  }
  
  return null;
}

function getDefaultLabel(id: FieldId): string {
  const labels: Record<FieldId, string> = {
    full_name: "Full Name",
    email: "Email Address",
    department_or_class: "Department / Class",
    identifier: "Matric / ID",
    graduation_year: "Year",
    role: "Role",
    quote: "Quote",
    cohort: "Cohort",
  };
  return labels[id] || id;
}
