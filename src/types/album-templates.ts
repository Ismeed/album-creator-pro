import type { SubmissionWithParticipant } from "@/hooks/useSubmissions";
import type { AlbumWithStats } from "@/hooks/useAlbums";

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
}

// Participant entry for template
export interface ParticipantEntry {
  id: string;
  fullName: string;
  departmentOrClass?: string;
  identifier?: string;
  photoUrl: string;
  processedPhotoUrl?: string;
}

// Full album data for template rendering
export interface AlbumTemplateData {
  cover: CoverPageData;
  participants: ParticipantEntry[];
  templateId: string;
  generatedAt: string;
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

// Transform raw data to template-ready format
export function prepareAlbumTemplateData(
  album: AlbumWithStats,
  submissions: SubmissionWithParticipant[],
  templateId: string = "classic"
): AlbumTemplateData {
  // Filter for approved submissions only
  // If album requires payment, also filter for successful payments
  const eligibleSubmissions = submissions.filter((sub) => {
    const isApproved = sub.approval_status === "approved";
    const isPaid = album.payment_mode === "organizer_pays" || sub.payment_status === "successful";
    return isApproved && isPaid;
  });

  // Sort by participant name
  const sortedSubmissions = [...eligibleSubmissions].sort((a, b) => {
    const nameA = a.participant?.full_name || "";
    const nameB = b.participant?.full_name || "";
    return nameA.localeCompare(nameB);
  });

  // Transform to participant entries
  const participants: ParticipantEntry[] = sortedSubmissions.map((sub) => ({
    id: sub.id,
    fullName: sub.participant?.full_name || "Unknown",
    departmentOrClass: sub.participant?.department_or_class || undefined,
    identifier: sub.participant?.identifier || undefined,
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
  };

  return {
    cover,
    participants,
    templateId,
    generatedAt: new Date().toISOString(),
  };
}
