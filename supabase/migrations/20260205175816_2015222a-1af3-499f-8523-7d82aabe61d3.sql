-- Add template_id column to albums table for template selection
ALTER TABLE public.albums 
ADD COLUMN template_id text NOT NULL DEFAULT 'classic';

-- Add custom_fields column to store up to 3 custom text fields
-- Format: [{ "label": "Field Name", "value": "" }]
ALTER TABLE public.albums 
ADD COLUMN custom_fields jsonb DEFAULT NULL;

-- Add template_id column to participants for storing custom field values
ALTER TABLE public.participants
ADD COLUMN custom_field_values jsonb DEFAULT NULL;