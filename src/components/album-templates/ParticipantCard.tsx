import type { ParticipantEntry } from "@/types/album-templates";
import { getDisplayFields } from "@/types/album-templates";
import type { StoredSchemaConfig } from "@/types/field-schemas";
import { useSignedPhotoUrl } from "@/hooks/useSignedPhotoUrl";
import { Loader2 } from "lucide-react";

interface ParticipantCardProps {
  participant: ParticipantEntry;
  variant?: "classic" | "modern";
  schemaConfig?: StoredSchemaConfig;
}

export function ParticipantCard({ participant, variant = "classic", schemaConfig }: ParticipantCardProps) {
  // Use processed photo if available, fallback to original
  const rawPhotoUrl = participant.processedPhotoUrl || participant.photoUrl;
  
  // Generate signed URL for private bucket access
  const { signedUrl: photoUrl, isLoading } = useSignedPhotoUrl(rawPhotoUrl);

  if (isLoading || !photoUrl) {
    return <LoadingCard variant={variant} />;
  }

  if (variant === "modern") {
    return <ModernCard participant={participant} photoUrl={photoUrl} schemaConfig={schemaConfig} />;
  }
  return <ClassicCard participant={participant} photoUrl={photoUrl} schemaConfig={schemaConfig} />;
}

function LoadingCard({ variant }: { variant: "classic" | "modern" }) {
  if (variant === "modern") {
    return (
      <div className="participant-card relative bg-card rounded-xl overflow-hidden border border-border shadow-sm">
        <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
        <div className="p-4 bg-card">
          <div className="h-4 bg-muted rounded animate-pulse mb-1" />
          <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="participant-card flex flex-col items-center p-6 bg-card rounded-lg border border-border">
      <div className="w-40 h-48 mb-4 overflow-hidden rounded-md bg-muted flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
      <div className="text-center space-y-1 w-full">
        <div className="h-5 bg-muted rounded animate-pulse mx-auto w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse mx-auto w-1/2" />
      </div>
    </div>
  );
}

interface CardInnerProps {
  participant: ParticipantEntry;
  photoUrl: string;
  schemaConfig?: StoredSchemaConfig;
}

// Get participant field value by camelCase key
function getFieldValue(participant: ParticipantEntry, fieldKey: string): string | undefined {
  const value = participant[fieldKey as keyof ParticipantEntry];
  return typeof value === "string" ? value : undefined;
}

// Render secondary info based on schema
function renderSecondaryInfo(participant: ParticipantEntry, schemaConfig?: StoredSchemaConfig) {
  const displayFields = getDisplayFields(schemaConfig);
  
  // Get first two non-empty fields for display
  const fieldsToShow = displayFields
    .map(fieldKey => getFieldValue(participant, fieldKey))
    .filter(Boolean)
    .slice(0, 2);
  
  if (fieldsToShow.length === 0) return null;
  
  return (
    <>
      {fieldsToShow.map((value, index) => (
        <p key={index} className={index === 0 ? "text-sm text-muted-foreground" : "text-xs text-muted-foreground font-mono"}>
          {value}
        </p>
      ))}
    </>
  );
}

function ClassicCard({ participant, photoUrl, schemaConfig }: CardInnerProps) {
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
        {renderSecondaryInfo(participant, schemaConfig)}
        
        {/* Quote display for schemas that include it */}
        {participant.quote && (
          <p className="text-xs text-muted-foreground italic mt-2 max-w-[180px]">
            "{participant.quote}"
          </p>
        )}
      </div>
    </div>
  );
}

function ModernCard({ participant, photoUrl, schemaConfig }: CardInnerProps) {
  const displayFields = getDisplayFields(schemaConfig);
  
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
          {displayFields.slice(0, 2).map(fieldKey => {
            const value = getFieldValue(participant, fieldKey);
            if (!value) return null;
            
            // Style identifier-like fields differently
            const isIdField = fieldKey === "identifier";
            return (
              <span 
                key={fieldKey}
                className={isIdField 
                  ? "text-xs text-primary font-medium" 
                  : "text-sm text-muted-foreground"
                }
              >
                {isIdField ? `#${value}` : value}
              </span>
            );
          })}
        </div>
        
        {/* Quote for modern cards */}
        {participant.quote && (
          <p className="text-xs text-muted-foreground italic mt-2 line-clamp-2">
            "{participant.quote}"
          </p>
        )}
      </div>
    </div>
  );
}
