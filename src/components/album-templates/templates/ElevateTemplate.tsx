import type { ParticipantEntry } from "@/types/album-templates";
import type { StoredSchemaConfig } from "@/types/field-schemas";
import { getDisplayFields } from "@/types/album-templates";
import { useSignedPhotoUrl } from "@/hooks/useSignedPhotoUrl";
import { Loader2 } from "lucide-react";

interface ElevateCardProps {
  participant: ParticipantEntry;
  schemaConfig?: StoredSchemaConfig;
}

function getFieldValue(participant: ParticipantEntry, fieldKey: string): string | undefined {
  const value = participant[fieldKey as keyof ParticipantEntry];
  return typeof value === "string" ? value : undefined;
}

export function ElevateCard({ participant, schemaConfig }: ElevateCardProps) {
  const rawPhotoUrl = participant.processedPhotoUrl || participant.photoUrl;
  const { signedUrl: photoUrl, isLoading } = useSignedPhotoUrl(rawPhotoUrl);
  const displayFields = getDisplayFields(schemaConfig);

  if (isLoading || !photoUrl) {
    return (
      <div className="participant-card bg-card rounded-xl overflow-hidden shadow-md border border-border">
        <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
        <div className="p-4 space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="participant-card bg-card rounded-xl overflow-hidden shadow-md border border-border">
      {/* Large photo */}
      <div className="w-full aspect-[3/4] bg-muted">
        <img
          src={photoUrl}
          alt={participant.fullName}
          className="w-full h-full object-cover object-top"
          loading="lazy"
        />
      </div>

      {/* Elegant info section */}
      <div className="p-4">
        <h3 className="text-base font-bold text-foreground leading-tight mb-1">
          {participant.fullName}
        </h3>
        <div className="space-y-0.5">
          {displayFields.slice(0, 2).map(fieldKey => {
            const value = getFieldValue(participant, fieldKey);
            if (!value) return null;
            return (
              <p key={fieldKey} className="text-sm text-muted-foreground">
                {value}
              </p>
            );
          })}
        </div>
        {participant.quote && (
          <p className="text-xs text-muted-foreground italic mt-3 border-l-2 border-primary/30 pl-2">
            "{participant.quote}"
          </p>
        )}
      </div>
    </div>
  );
}

interface ElevateCoverProps {
  title: string;
  institutionName?: string;
  albumType: string;
  year: string;
  logoUrl?: string;
}

export function ElevateCover({ title, institutionName, albumType, year, logoUrl }: ElevateCoverProps) {
  return (
    <div className="album-page album-cover flex flex-col min-h-[297mm] bg-background text-foreground print:break-after-page">
      {/* Top accent */}
      <div className="h-1.5 bg-primary w-full" />

      <div className="flex-1 flex flex-col items-center justify-center p-16 text-center">
        {logoUrl && (
          <div className="mb-10">
            <img src={logoUrl} alt="Logo" className="w-32 h-32 object-contain mx-auto" />
          </div>
        )}

        <div className="inline-block px-5 py-2 bg-primary/10 rounded-full mb-8">
          <span className="text-base font-medium text-primary">{year}</span>
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-foreground">
          {title}
        </h1>

        <div className="space-y-2">
          {institutionName && (
            <p className="text-xl text-muted-foreground">{institutionName}</p>
          )}
          <p className="text-lg font-medium text-primary">{albumType}</p>
        </div>
      </div>

      {/* Bottom accent */}
      <div className="h-1.5 bg-primary w-full" />
    </div>
  );
}

interface ElevateGridProps {
  participants: ParticipantEntry[];
  schemaConfig?: StoredSchemaConfig;
}

export function ElevateGrid({ participants, schemaConfig }: ElevateGridProps) {
  const columnsPerPage = 3;
  const rowsPerPage = 2;
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
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Participants
            </h2>
            <span className="text-sm text-muted-foreground">
              Page {pageIndex + 1} of {pages.length}
            </span>
          </div>
          <div
            className="grid gap-8"
            style={{ gridTemplateColumns: `repeat(${columnsPerPage}, minmax(0, 1fr))` }}
          >
            {pageParticipants.map((participant) => (
              <ElevateCard key={participant.id} participant={participant} schemaConfig={schemaConfig} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
