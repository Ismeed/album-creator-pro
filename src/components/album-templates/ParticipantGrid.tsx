import type { ParticipantEntry } from "@/types/album-templates";
import { ParticipantCard } from "./ParticipantCard";

interface ParticipantGridProps {
  participants: ParticipantEntry[];
  variant?: "classic" | "modern";
  columnsPerPage?: number;
  rowsPerPage?: number;
}

export function ParticipantGrid({
  participants,
  variant = "classic",
  columnsPerPage = 4,
  rowsPerPage = 3,
}: ParticipantGridProps) {
  const participantsPerPage = columnsPerPage * rowsPerPage;

  // Split participants into pages
  const pages: ParticipantEntry[][] = [];
  for (let i = 0; i < participants.length; i += participantsPerPage) {
    pages.push(participants.slice(i, i + participantsPerPage));
  }

  const gridClass = variant === "modern"
    ? "grid gap-6"
    : "grid gap-8";

  const gridStyle = {
    gridTemplateColumns: `repeat(${columnsPerPage}, minmax(0, 1fr))`,
  };

  return (
    <div className="participant-pages">
      {pages.map((pageParticipants, pageIndex) => (
        <div
          key={pageIndex}
          className="album-page participant-page min-h-[297mm] bg-background p-12 print:break-after-page"
        >
          {/* Page header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Participants
            </h2>
            <span className="text-sm text-muted-foreground">
              Page {pageIndex + 1} of {pages.length}
            </span>
          </div>

          {/* Participant grid */}
          <div className={gridClass} style={gridStyle}>
            {pageParticipants.map((participant) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                variant={variant}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
