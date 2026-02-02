import type { AlbumTemplateData } from "@/types/album-templates";
import { CoverPage } from "./CoverPage";
import { ParticipantGrid } from "./ParticipantGrid";

interface AlbumTemplateProps {
  data: AlbumTemplateData;
  showWatermark?: boolean;
}

export function AlbumTemplate({ data, showWatermark = false }: AlbumTemplateProps) {
  const variant = data.templateId === "modern" ? "modern" : "classic";

  return (
    <div className="album-container bg-background text-foreground relative">
      {/* Print-specific styles */}
      <style>{`
        @media print {
          .album-container {
            width: 210mm;
            background: white !important;
          }
          .album-page {
            page-break-after: always;
            page-break-inside: avoid;
          }
          .album-page:last-child {
            page-break-after: auto;
          }
          .no-print {
            display: none !important;
          }
        }
        @page {
          size: A4 portrait;
          margin: 0;
        }
      `}</style>

      {/* Cover Page */}
      <CoverPage data={data.cover} variant={variant} />

      {/* Participant Pages */}
      {data.participants.length > 0 ? (
        <ParticipantGrid
          participants={data.participants}
          variant={variant}
          columnsPerPage={variant === "modern" ? 3 : 4}
          rowsPerPage={3}
        />
      ) : (
        <div className="album-page flex items-center justify-center min-h-[297mm] bg-background">
          <p className="text-muted-foreground text-lg">
            No approved participants to display
          </p>
        </div>
      )}

      {/* Preview watermark */}
      {showWatermark && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 no-print">
          <div className="text-8xl font-bold text-muted-foreground/10 rotate-[-30deg] select-none">
            PREVIEW
          </div>
        </div>
      )}
    </div>
  );
}
