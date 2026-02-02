import type { ParticipantEntry } from "@/types/album-templates";

interface ParticipantCardProps {
  participant: ParticipantEntry;
  variant?: "classic" | "modern";
}

export function ParticipantCard({ participant, variant = "classic" }: ParticipantCardProps) {
  // Use processed photo if available, fallback to original
  const photoUrl = participant.processedPhotoUrl || participant.photoUrl;

  if (variant === "modern") {
    return <ModernCard participant={participant} photoUrl={photoUrl} />;
  }
  return <ClassicCard participant={participant} photoUrl={photoUrl} />;
}

interface CardInnerProps {
  participant: ParticipantEntry;
  photoUrl: string;
}

function ClassicCard({ participant, photoUrl }: CardInnerProps) {
  return (
    <div className="participant-card flex flex-col items-center p-6 bg-card rounded-lg border border-border">
      {/* Photo container - standardized size */}
      <div className="w-40 h-48 mb-4 overflow-hidden rounded-md bg-muted flex-shrink-0">
        <img
          src={photoUrl}
          alt={participant.fullName}
          className="w-full h-full object-cover object-top"
          loading="lazy"
        />
      </div>

      {/* Participant details */}
      <div className="text-center space-y-1">
        <h3 className="text-lg font-semibold text-foreground leading-tight">
          {participant.fullName}
        </h3>

        {participant.departmentOrClass && (
          <p className="text-sm text-muted-foreground">
            {participant.departmentOrClass}
          </p>
        )}

        {participant.identifier && (
          <p className="text-xs text-muted-foreground font-mono">
            {participant.identifier}
          </p>
        )}
      </div>
    </div>
  );
}

function ModernCard({ participant, photoUrl }: CardInnerProps) {
  return (
    <div className="participant-card relative bg-card rounded-xl overflow-hidden border border-border shadow-sm">
      {/* Photo container - standardized size */}
      <div className="w-full aspect-[3/4] bg-muted">
        <img
          src={photoUrl}
          alt={participant.fullName}
          className="w-full h-full object-cover object-top"
          loading="lazy"
        />
      </div>

      {/* Info overlay */}
      <div className="p-4 bg-card">
        <h3 className="text-base font-bold text-foreground leading-tight mb-1">
          {participant.fullName}
        </h3>

        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          {participant.departmentOrClass && (
            <span className="text-sm text-muted-foreground">
              {participant.departmentOrClass}
            </span>
          )}
          {participant.identifier && (
            <span className="text-xs text-primary font-medium">
              #{participant.identifier}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
