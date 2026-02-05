import type { ParticipantEntry } from "@/types/album-templates";
import type { StoredSchemaConfig } from "@/types/field-schemas";
import { getDisplayFields } from "@/types/album-templates";
import { useSignedPhotoUrl } from "@/hooks/useSignedPhotoUrl";
import { Loader2 } from "lucide-react";

interface MomentumCardProps {
  participant: ParticipantEntry;
  schemaConfig?: StoredSchemaConfig;
}

function getFieldValue(participant: ParticipantEntry, fieldKey: string): string | undefined {
  const value = participant[fieldKey as keyof ParticipantEntry];
  return typeof value === "string" ? value : undefined;
}

export function MomentumCard({ participant, schemaConfig }: MomentumCardProps) {
  const rawPhotoUrl = participant.processedPhotoUrl || participant.photoUrl;
  const { signedUrl: photoUrl, isLoading } = useSignedPhotoUrl(rawPhotoUrl);
  const displayFields = getDisplayFields(schemaConfig);

  if (isLoading || !photoUrl) {
    return (
      <div className="participant-card relative bg-card rounded-lg overflow-hidden border-l-4 border-primary">
        <div className="flex gap-4 p-4">
          <div className="w-20 h-24 bg-muted rounded flex items-center justify-center flex-shrink-0">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="participant-card relative bg-card rounded-lg overflow-hidden border-l-4 border-primary shadow-sm">
      <div className="flex gap-4 p-4">
        {/* Photo */}
        <div className="w-20 h-24 bg-muted rounded overflow-hidden flex-shrink-0">
          <img
            src={photoUrl}
            alt={participant.fullName}
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground leading-tight mb-1 truncate">
            {participant.fullName}
          </h3>
          {displayFields.slice(0, 2).map(fieldKey => {
            const value = getFieldValue(participant, fieldKey);
            if (!value) return null;
            const isId = fieldKey === "identifier";
            return (
              <p 
                key={fieldKey} 
                className={isId ? "text-xs font-mono text-primary" : "text-xs text-muted-foreground truncate"}
              >
                {isId ? `#${value}` : value}
              </p>
            );
          })}
          {participant.quote && (
            <p className="text-[10px] text-muted-foreground italic mt-2 line-clamp-2">
              "{participant.quote}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface MomentumCoverProps {
  title: string;
  institutionName?: string;
  albumType: string;
  year: string;
  logoUrl?: string;
}

export function MomentumCover({ title, institutionName, albumType, year, logoUrl }: MomentumCoverProps) {
  return (
    <div className="album-page album-cover flex flex-col min-h-[297mm] bg-background text-foreground print:break-after-page">
      {/* Bold header with accent */}
      <div className="bg-primary text-primary-foreground py-16 px-12">
        <div className="max-w-2xl mx-auto text-center">
          {logoUrl && (
            <div className="mb-8">
              <img src={logoUrl} alt="Logo" className="w-20 h-20 object-contain mx-auto" />
            </div>
          )}
          <h1 className="text-5xl font-black tracking-tight mb-4">
            {title}
          </h1>
          {institutionName && (
            <p className="text-xl opacity-90">{institutionName}</p>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col items-center justify-center p-16">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground mb-4">{albumType}</p>
          <div className="inline-block px-8 py-3 bg-primary/10 rounded-full">
            <span className="text-3xl font-bold text-primary">{year}</span>
          </div>
        </div>
      </div>

      {/* Bottom accent bar */}
      <div className="h-4 bg-primary" />
    </div>
  );
}

interface MomentumGridProps {
  participants: ParticipantEntry[];
  schemaConfig?: StoredSchemaConfig;
}

export function MomentumGrid({ participants, schemaConfig }: MomentumGridProps) {
  const columnsPerPage = 2;
  const rowsPerPage = 5;
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
          className="album-page participant-page min-h-[297mm] bg-background p-8 print:break-after-page"
        >
          {/* Bold header */}
          <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-primary">
            <div className="w-1 h-8 bg-primary rounded-full" />
            <h2 className="text-lg font-bold text-foreground uppercase tracking-wide">
              Participants
            </h2>
            <span className="ml-auto text-sm font-medium text-muted-foreground">
              {pageIndex + 1} / {pages.length}
            </span>
          </div>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columnsPerPage}, minmax(0, 1fr))` }}
          >
            {pageParticipants.map((participant) => (
              <MomentumCard key={participant.id} participant={participant} schemaConfig={schemaConfig} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
