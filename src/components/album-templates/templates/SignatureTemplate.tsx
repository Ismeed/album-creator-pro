import type { ParticipantEntry } from "@/types/album-templates";
import type { StoredSchemaConfig } from "@/types/field-schemas";
import { getDisplayFields } from "@/types/album-templates";
import { useSignedPhotoUrl } from "@/hooks/useSignedPhotoUrl";
import { Loader2 } from "lucide-react";

interface SignatureCardProps {
  participant: ParticipantEntry;
  schemaConfig?: StoredSchemaConfig;
}

function getFieldValue(participant: ParticipantEntry, fieldKey: string): string | undefined {
  const value = participant[fieldKey as keyof ParticipantEntry];
  return typeof value === "string" ? value : undefined;
}

export function SignatureCard({ participant, schemaConfig }: SignatureCardProps) {
  const rawPhotoUrl = participant.processedPhotoUrl || participant.photoUrl;
  const { signedUrl: photoUrl, isLoading } = useSignedPhotoUrl(rawPhotoUrl);
  const displayFields = getDisplayFields(schemaConfig);

  if (isLoading || !photoUrl) {
    return (
      <div className="participant-card bg-card overflow-hidden">
        <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
        <div className="p-6 bg-gradient-to-b from-card to-muted/20 space-y-2">
          <div className="h-5 bg-muted rounded animate-pulse w-3/4 mx-auto" />
          <div className="h-4 bg-muted rounded animate-pulse w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="participant-card bg-card overflow-hidden shadow-lg">
      {/* Full-width photo emphasis */}
      <div className="w-full aspect-[2/3] bg-muted relative">
        <img
          src={photoUrl}
          alt={participant.fullName}
          className="w-full h-full object-cover object-top"
          loading="lazy"
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Name overlay on photo */}
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h3 className="text-xl font-bold leading-tight drop-shadow-md">
            {participant.fullName}
          </h3>
        </div>
      </div>

      {/* Yearbook-style info section */}
      <div className="p-4 bg-card border-t border-border text-center">
        <div className="flex flex-wrap justify-center gap-2">
          {displayFields.slice(0, 3).map(fieldKey => {
            const value = getFieldValue(participant, fieldKey);
            if (!value) return null;
            return (
              <span 
                key={fieldKey} 
                className="inline-block px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground"
              >
                {value}
              </span>
            );
          })}
        </div>
        {participant.quote && (
          <p className="text-sm text-muted-foreground italic mt-3 leading-relaxed">
            "{participant.quote}"
          </p>
        )}
      </div>
    </div>
  );
}

interface SignatureCoverProps {
  title: string;
  institutionName?: string;
  albumType: string;
  year: string;
  logoUrl?: string;
}

export function SignatureCover({ title, institutionName, albumType, year, logoUrl }: SignatureCoverProps) {
  return (
    <div className="album-page album-cover flex flex-col min-h-[297mm] bg-background text-foreground print:break-after-page relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5" />
      <div className="absolute bottom-0 left-0 w-2/3 h-1/3 bg-primary/5" />

      <div className="relative flex-1 flex flex-col items-center justify-center p-16 text-center">
        {logoUrl && (
          <div className="mb-12">
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="w-36 h-36 object-contain mx-auto drop-shadow-xl" 
            />
          </div>
        )}

        {/* Year badge */}
        <div className="inline-block px-6 py-2 border-2 border-foreground mb-10">
          <span className="text-2xl font-bold tracking-widest">{year}</span>
        </div>

        <h1 className="text-6xl font-black tracking-tight mb-6 text-foreground">
          {title}
        </h1>

        {institutionName && (
          <p className="text-2xl text-muted-foreground mb-4">{institutionName}</p>
        )}

        <div className="flex items-center gap-4 mt-6">
          <div className="h-px w-16 bg-border" />
          <p className="text-xl font-semibold text-primary">{albumType}</p>
          <div className="h-px w-16 bg-border" />
        </div>
      </div>

      {/* Signature line */}
      <div className="h-2 bg-primary" />
    </div>
  );
}

interface SignatureGridProps {
  participants: ParticipantEntry[];
  schemaConfig?: StoredSchemaConfig;
}

export function SignatureGrid({ participants, schemaConfig }: SignatureGridProps) {
  const columnsPerPage = 2;
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
          className="album-page participant-page min-h-[297mm] bg-background p-8 print:break-after-page"
        >
          {/* Elegant header */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="h-px flex-1 bg-border" />
            <h2 className="text-base font-semibold text-foreground tracking-widest uppercase">
              Participants
            </h2>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div
            className="grid gap-8"
            style={{ gridTemplateColumns: `repeat(${columnsPerPage}, minmax(0, 1fr))` }}
          >
            {pageParticipants.map((participant) => (
              <SignatureCard key={participant.id} participant={participant} schemaConfig={schemaConfig} />
            ))}
          </div>
          {/* Footer */}
          <div className="mt-8 text-center">
            <span className="text-xs text-muted-foreground">
              Page {pageIndex + 1} of {pages.length}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
