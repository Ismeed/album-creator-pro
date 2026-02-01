/**
 * OLEX MVP Data Models
 * 
 * This file documents the core data models and their relationships.
 * The actual types are auto-generated in src/integrations/supabase/types.ts
 * 
 * @see Database schema created via Lovable Cloud migrations
 */

// =====================================================
// ENUM TYPES
// =====================================================

/**
 * Types of albums supported
 */
export type AlbumType = 'class' | 'department' | 'faculty' | 'training' | 'bootcamp' | 'other';

/**
 * Payment mode for an album
 * - organizer_pays: Organizer pays for album generation
 * - participant_pays: Each participant pays to be included
 */
export type PaymentMode = 'organizer_pays' | 'participant_pays';

/**
 * Status of a payment transaction
 */
export type PaymentStatus = 'pending' | 'successful' | 'failed';

/**
 * Approval status for a submission
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

// =====================================================
// DATA MODELS
// =====================================================

/**
 * Organizer - The album creator and manager
 * 
 * Relationships:
 * - One Organizer can create many Albums
 * - Linked to auth.users via id (same UUID)
 */
export interface Organizer {
  id: string;           // UUID, references auth.users(id)
  full_name: string;
  email: string;        // unique
  created_at: string;   // ISO timestamp
}

/**
 * Album - A single photo album collection
 * 
 * Relationships:
 * - Belongs to one Organizer (organizer_id)
 * - Has many Submissions
 * - Has many Payments
 */
export interface Album {
  id: string;                           // UUID
  organizer_id: string;                 // FK to organizers.id
  title: string;
  institution_name: string | null;
  album_type: AlbumType;
  payment_mode: PaymentMode;
  price_per_participant: number | null; // Decimal
  submission_deadline: string | null;   // ISO timestamp
  is_locked: boolean;                   // Prevents new submissions
  created_at: string;                   // ISO timestamp
}

/**
 * Participant - A person appearing in an album
 * 
 * Notes:
 * - Participants do NOT authenticate
 * - Linked to albums through Submissions
 */
export interface Participant {
  id: string;                        // UUID
  full_name: string;
  identifier: string | null;         // Matric number / Employee ID
  department_or_class: string | null;
  created_at: string;                // ISO timestamp
}

/**
 * Submission - A participant's entry into an album
 * 
 * Relationships:
 * - Belongs to one Album (album_id)
 * - Belongs to one Participant (participant_id)
 * - May have one Payment (if participant_pays mode)
 * 
 * Constraints:
 * - UNIQUE(album_id, participant_id) - one submission per participant per album
 * - Cannot submit after submission_deadline
 * - Cannot submit to locked albums
 */
export interface Submission {
  id: string;                              // UUID
  album_id: string;                        // FK to albums.id
  participant_id: string;                  // FK to participants.id
  photo_url: string;                       // Original uploaded photo
  processed_photo_url: string | null;      // After background processing
  background_color: string | null;         // Background color applied
  payment_status: PaymentStatus;           // pending | paid | not_required
  approval_status: ApprovalStatus;         // pending | approved | rejected
  submitted_at: string;                    // ISO timestamp
}

/**
 * Payment - A financial transaction
 * 
 * Relationships:
 * - Belongs to one Album (album_id)
 * - May belong to one Submission (submission_id) - for participant_pays mode
 * 
 * Rules:
 * - If payment_mode = organizer_pays: Payment links to Album only
 * - If payment_mode = participant_pays: Payment links to Submission
 */
export interface Payment {
  id: string;                       // UUID
  submission_id: string | null;     // FK to submissions.id (nullable)
  album_id: string;                 // FK to albums.id
  amount: number;                   // Decimal
  payment_reference: string | null;
  payment_channel: string | null;
  status: PaymentStatus;
  paid_at: string | null;           // ISO timestamp
}

// =====================================================
// BUSINESS RULES & CONSTRAINTS
// =====================================================

/**
 * Album Generation Rules:
 * - Album must be locked (is_locked = true)
 * - All required payments must be successful
 * - For organizer_pays: organizer payment must be successful
 * - For participant_pays: all included submissions must have successful payments
 */

/**
 * Submission Rules:
 * - Cannot submit after submission_deadline
 * - Cannot submit to locked albums
 * - One participant can only submit once per album (enforced by unique constraint)
 */

/**
 * Cascade Delete Rules:
 * - Deleting an Album deletes all related Submissions and Payments
 * - Deleting a Participant deletes all their Submissions
 * - Deleting a Submission sets payment.submission_id to NULL
 */

// =====================================================
// SECURITY (RLS) SUMMARY
// =====================================================

/**
 * Organizers table:
 * - Organizers can only view/update their own profile
 * - Auto-created on signup via trigger
 * 
 * Albums table:
 * - Organizers can CRUD their own albums
 * - Public (anon) can view unlocked albums for submission pages
 * 
 * Participants table:
 * - Public can insert (for unauthenticated submission flow)
 * - Authenticated users can view all (for organizer dashboards)
 * 
 * Submissions table:
 * - Public can insert to open albums (validated by trigger + RLS)
 * - Organizers can view/update/delete submissions for their albums
 * - Public can view (for submission confirmation)
 * 
 * Payments table:
 * - Public can insert for valid albums
 * - Organizers can view/update/delete payments for their albums
 */
