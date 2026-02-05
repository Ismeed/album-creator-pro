import type { ParticipantEntry } from "@/types/album-templates";
import type { StoredSchemaConfig } from "@/types/field-schemas";
import { getDisplayFields } from "@/types/album-templates";
import { useSignedPhotoUrl } from "@/hooks/useSignedPhotoUrl";
import { Loader2 } from "lucide-react";

interface ClassicGridCardProps {
  participant: ParticipantEntry;
  schemaConfig?: StoredSchemaConfig;
}

function getFieldValue(participant: ParticipantEntry, fieldKey: string): string | undefined {
  const value = participant[fieldKey as keyof ParticipantEntry];
  return typeof value === "string" ? value : undefined;
}

export function ClassicGridCard({ participant, schemaConfig }: ClassicGridCardProps) {
  const rawPhotoUrl = participant.processedPhotoUrl || participant.photoUrl;
  const { signedUrl: photoUrl, isLoading } = useSignedPhotoUrl(rawPhotoUrl);
  const displayFields = getDisplayFields(schemaConfig);

  if (isLoading || !photoUrl) {
    return (
      <div className="participant-card bg-card border border-border rounded overflow-hidden">
        <div className="w-full aspect-[4/5] bg-muted flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
        <div className="p-2 space-y-1">
          <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-2 bg-muted rounded animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="participant-card bg-card border border-border rounded overflow-hidden">
      {/* Compact photo */}
      <div className="w-full aspect-[4/5] bg-muted">
        <img
          src={photoUrl}
          alt={participant.fullName}
          className="w-full h-full object-cover object-top"
          loading="lazy"
        />
      </div>

      {/* Compact info */}
      <div className="p-2 text-center">
        <h3 className="text-xs font-semibold text-foreground leading-tight truncate">
          {participant.fullName}
        </h3>
        {displayFields.slice(0, 1).map(fieldKey => {
          const value = getFieldValue(participant, fieldKey);
          if (!value) return null;
          return (
            <p key={fieldKey} className="text-[10px] text-muted-foreground truncate">
              {value}
            </p>
          );
        })}
      </div>
    </div>
  );
}

interface ClassicGridCoverProps {
  title: string;
  institutionName?: string;
  albumType: string;
  year: string;
  logoUrl?: string;
}

export function ClassicGridCover({ title, institutionName, albumType, year, logoUrl }: ClassicGridCoverProps) {
  return (
    <div className="album-page album-cover flex flex-col items-center justify-center min-h-[297mm] bg-background text-foreground p-12 text-center print:break-after-page">
      {logoUrl && (
        <div className="mb-10">
          <img src={logoUrl} alt="Logo" className="w-24 h-24 object-contain mx-auto" />
        </div>
      )}
      {institutionName && (
        <p className="text-sm tracking-wide uppercase text-muted-foreground mb-4">
          {institutionName}
        </p>
      )}
      <h1 className="text-3xl font-bold tracking-tight mb-3 text-foreground">
        {title}
      </h1>
      <p className="text-base text-muted-foreground mb-6">{albumType}</p>
      <div className="inline-block px-4 py-1 bg-muted rounded-full">
        <span className="text-sm font-medium text-muted-foreground">{year}</span>
      </div>
    </div>
  );
}

interface ClassicGridPageProps {
  participants: ParticipantEntry[];
  schemaConfig?: StoredSchemaConfig;
}

export function ClassicGridPage({ participants, schemaConfig }: ClassicGridPageProps) {
  const columnsPerPage = 5;
  const rowsPerPage = 4;
  const participantsPerPage = columnsPerPage * rowsPerPage;

  const pages: ParticipantEntry[][] = [];
  for (let i = 0; i < participants.length; i += participantsPerPage) {
    pages.push(participants.slice(i, i + participantsPerPage));
  }

  return (
    <div className="participant-pages">
      {pages.map((pageParticipants, pageIndex) => (
        <div
          key={pageIndex}
          className="album-page participant-page min-h-[297mm] bg-background p-6 print:break-after-page"
        >
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
            <h2 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Participants
            </h2>
            <span className="text-[10px] text-muted-foreground">
              {pageIndex + 1} / {pages.length}
            </span>
          </div>
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${columnsPerPage}, minmax(0, 1fr))` }}
          >
            {pageParticipants.map((participant) => (
              <ClassicGridCard key={participant.id} participant={participant} schemaConfig={schemaConfig} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
