import type { ParticipantEntry } from "@/types/album-templates";
import type { StoredSchemaConfig } from "@/types/field-schemas";
import { getDisplayFields } from "@/types/album-templates";
import { useSignedPhotoUrl } from "@/hooks/useSignedPhotoUrl";
import { Loader2 } from "lucide-react";

interface FoundationCardProps {
  participant: ParticipantEntry;
  schemaConfig?: StoredSchemaConfig;
}

function getFieldValue(participant: ParticipantEntry, fieldKey: string): string | undefined {
  const value = participant[fieldKey as keyof ParticipantEntry];
  return typeof value === "string" ? value : undefined;
}

export function FoundationCard({ participant, schemaConfig }: FoundationCardProps) {
  const rawPhotoUrl = participant.processedPhotoUrl || participant.photoUrl;
  const { signedUrl: photoUrl, isLoading } = useSignedPhotoUrl(rawPhotoUrl);
  const displayFields = getDisplayFields(schemaConfig);

  if (isLoading || !photoUrl) {
    return (
      <div className="participant-card flex flex-col items-center p-8 bg-card rounded-lg border border-border">
        <div className="w-36 h-44 mb-4 overflow-hidden rounded-md bg-muted flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
        <div className="h-5 bg-muted rounded animate-pulse w-3/4 mb-2" />
        <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
      </div>
    );
  }

  return (
    <div className="participant-card flex flex-col items-center p-8 bg-card">
      {/* Centered portrait */}
      <div className="w-36 h-44 mb-4 overflow-hidden rounded-md bg-muted flex-shrink-0 shadow-sm">
        <img
          src={photoUrl}
          alt={participant.fullName}
          className="w-full h-full object-cover object-top"
          loading="lazy"
        />
      </div>

      {/* Clean typography */}
      <div className="text-center space-y-1">
        <h3 className="text-base font-semibold text-foreground leading-tight">
          {participant.fullName}
        </h3>
        {displayFields.slice(0, 2).map(fieldKey => {
          const value = getFieldValue(participant, fieldKey);
          if (!value) return null;
          return (
            <p key={fieldKey} className="text-sm text-muted-foreground">
              {value}
            </p>
          );
        })}
        {participant.quote && (
          <p className="text-xs text-muted-foreground italic mt-2 max-w-[160px]">
            "{participant.quote}"
          </p>
        )}
      </div>
    </div>
  );
}

interface FoundationCoverProps {
  title: string;
  institutionName?: string;
  albumType: string;
  year: string;
  logoUrl?: string;
}

export function FoundationCover({ title, institutionName, albumType, year, logoUrl }: FoundationCoverProps) {
  return (
    <div className="album-page album-cover flex flex-col items-center justify-center min-h-[297mm] bg-background text-foreground p-16 text-center print:break-after-page">
      {logoUrl && (
        <div className="mb-12">
          <img src={logoUrl} alt="Logo" className="w-28 h-28 object-contain mx-auto" />
        </div>
      )}
      {institutionName && (
        <p className="text-base tracking-widest uppercase text-muted-foreground mb-6">
          {institutionName}
        </p>
      )}
      <h1 className="text-4xl font-semibold tracking-tight mb-4 text-foreground">
        {title}
      </h1>
      <p className="text-lg text-muted-foreground mb-8">{albumType}</p>
      <div className="w-16 h-0.5 bg-border mb-8" />
      <p className="text-2xl font-light text-muted-foreground">{year}</p>
    </div>
  );
}

interface FoundationGridProps {
  participants: ParticipantEntry[];
  schemaConfig?: StoredSchemaConfig;
}

export function FoundationGrid({ participants, schemaConfig }: FoundationGridProps) {
  const columnsPerPage = 3;
  const rowsPerPage = 3;
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
          className="album-page participant-page min-h-[297mm] bg-background p-10 print:break-after-page"
        >
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-border">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Participants
            </h2>
            <span className="text-xs text-muted-foreground">
              Page {pageIndex + 1} of {pages.length}
            </span>
          </div>
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: `repeat(${columnsPerPage}, minmax(0, 1fr))` }}
          >
            {pageParticipants.map((participant) => (
              <FoundationCard key={participant.id} participant={participant} schemaConfig={schemaConfig} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
