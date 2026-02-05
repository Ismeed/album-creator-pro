import type { AlbumTemplateData, TemplateVariant } from "@/types/album-templates";
import { FoundationCover, FoundationGrid } from "./templates/FoundationTemplate";
import { ClassicGridCover, ClassicGridPage } from "./templates/ClassicGridTemplate";
import { ElevateCover, ElevateGrid } from "./templates/ElevateTemplate";
import { MomentumCover, MomentumGrid } from "./templates/MomentumTemplate";
import { SignatureCover, SignatureGrid } from "./templates/SignatureTemplate";

interface AlbumTemplateProps {
  data: AlbumTemplateData;
  showWatermark?: boolean;
}

export function AlbumTemplate({ data, showWatermark = false }: AlbumTemplateProps) {
  const templateId = data.templateId as TemplateVariant;

  const renderCover = () => {
    const coverProps = {
      title: data.cover.title,
      institutionName: data.cover.institutionName,
      albumType: data.cover.albumType,
      year: data.cover.year,
      logoUrl: data.cover.logoUrl,
    };

    switch (templateId) {
      case "classic-grid":
        return <ClassicGridCover {...coverProps} />;
      case "elevate":
        return <ElevateCover {...coverProps} />;
      case "momentum":
        return <MomentumCover {...coverProps} />;
      case "signature":
        return <SignatureCover {...coverProps} />;
      case "foundation":
      default:
        return <FoundationCover {...coverProps} />;
    }
  };

  const renderParticipants = () => {
    if (data.participants.length === 0) {
      return (
        <div className="album-page flex items-center justify-center min-h-[297mm] bg-background">
          <p className="text-muted-foreground text-lg">
            No approved participants to display
          </p>
        </div>
      );
    }

    const gridProps = {
      participants: data.participants,
      schemaConfig: data.schemaConfig,
    };

    switch (templateId) {
      case "classic-grid":
        return <ClassicGridPage {...gridProps} />;
      case "elevate":
        return <ElevateGrid {...gridProps} />;
      case "momentum":
        return <MomentumGrid {...gridProps} />;
      case "signature":
        return <SignatureGrid {...gridProps} />;
      case "foundation":
      default:
        return <FoundationGrid {...gridProps} />;
    }
  };

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
      {renderCover()}

      {/* Participant Pages */}
      {renderParticipants()}

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
