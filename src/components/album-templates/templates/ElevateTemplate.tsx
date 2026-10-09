import type { ParticipantEntry } from "@/types/album-templates";
import type { StoredSchemaConfig } from "@/types/field-schemas";
import { getDisplayFields } from "@/types/album-templates";
import { useSignedPhotoUrl } from "@/hooks/useSignedPhotoUrl";
import { Loader2 } from "lucide-react";

function getFieldValue(participant: ParticipantEntry, fieldKey: string): string | undefined {
  const value = participant[fieldKey as keyof ParticipantEntry];
  return typeof value === "string" ? value : undefined;
}

interface ElevateCardProps { participant: ParticipantEntry; schemaConfig?: StoredSchemaConfig }

export function ElevateCard({ participant, schemaConfig }: ElevateCardProps) {
  const rawPhotoUrl = participant.processedPhotoUrl || participant.photoUrl;
  const { signedUrl: photoUrl, isLoading } = useSignedPhotoUrl(rawPhotoUrl);
  const displayFields = getDisplayFields(schemaConfig);
  const fields = displayFields.map((key) => getFieldValue(participant, key)).filter(Boolean).slice(0, 2);

  return (
    <article className="participant-card overflow-hidden border border-[#d9c9aa] bg-[#f8f4ec] shadow-[0_14px_35px_-20px_rgba(75,52,25,0.55)]">
      <div className="relative aspect-[3/4] bg-[#e7dfd2]">
        {isLoading || !photoUrl ? <Loader2 className="absolute left-1/2 top-1/2 animate-spin text-[#8d7652]" /> : <img src={photoUrl} alt={participant.fullName} className="h-full w-full object-cover object-top" loading="lazy" />}
        <div className="absolute inset-x-4 bottom-4 border border-white/60 bg-[#f8f4ec]/90 p-3 backdrop-blur-sm">
          <h3 className="font-serif text-lg leading-tight text-[#2d2924]">{participant.fullName}</h3>
          {fields[0] && <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#8d7652]">{fields[0]}</p>}
        </div>
      </div>
      <div className="flex min-h-20 flex-col justify-center px-4 py-3 text-center">
        {fields[1] && <p className="text-xs text-[#756b60]">{fields[1]}</p>}
        {participant.quote && <p className="mt-2 line-clamp-2 font-serif text-xs italic text-[#8e8172]">“{participant.quote}”</p>}
      </div>
    </article>
  );
}

interface ElevateCoverProps { title: string; institutionName?: string; albumType: string; year: string; logoUrl?: string }

export function ElevateCover({ title, institutionName, albumType, year, logoUrl }: ElevateCoverProps) {
  return (
    <div className="album-page album-cover relative flex min-h-[297mm] flex-col overflow-hidden bg-[#f5f0e8] text-[#2d2924] print:break-after-page">
      <div className="absolute inset-7 border border-[#cbb994]" />
      <div className="relative flex flex-1 flex-col items-center justify-center px-16 text-center">
        <p className="mb-8 text-[11px] uppercase tracking-[0.45em] text-[#8d7652]">{albumType}</p>
        {logoUrl && <img src={logoUrl} alt="Logo" className="mb-8 size-24 object-contain" />}
        <div className="mb-8 h-px w-16 bg-[#b89d6d]" />
        <h1 className="max-w-3xl font-serif text-6xl font-medium leading-[0.95] tracking-[-0.04em]">{title}</h1>
        {institutionName && <p className="mt-6 text-lg tracking-[0.18em] text-[#756b60]">{institutionName}</p>}
        <div className="mt-10 flex items-center gap-4 text-xs uppercase tracking-[0.35em] text-[#8d7652]"><span>{year}</span><span className="size-1 rounded-full bg-[#b89d6d]" /><span>Edition</span></div>
      </div>
      <div className="relative mx-auto mb-12 h-px w-24 bg-[#b89d6d]" />
    </div>
  );
}

interface ElevateGridProps { participants: ParticipantEntry[]; schemaConfig?: StoredSchemaConfig }
export function ElevateGrid({ participants, schemaConfig }: ElevateGridProps) {
  const pages: ParticipantEntry[][] = [];
  for (let i = 0; i < participants.length; i += 6) pages.push(participants.slice(i, i + 6));
  return <div className="participant-pages">{pages.map((page, index) => <div key={index} className="album-page min-h-[297mm] bg-[#f5f0e8] p-12 print:break-after-page"><div className="mb-8 flex items-end justify-between border-b border-[#d9c9aa] pb-4"><div><p className="text-[10px] uppercase tracking-[0.35em] text-[#8d7652]">{String(index + 1).padStart(2, "0")}</p><h2 className="mt-1 font-serif text-2xl text-[#2d2924]">The collection</h2></div><span className="text-[10px] uppercase tracking-[0.2em] text-[#8d7652]">{pages.length} pages</span></div><div className="grid grid-cols-3 gap-6">{page.map((participant) => <ElevateCard key={participant.id} participant={participant} schemaConfig={schemaConfig} />)}</div></div>)}</div>;
}
