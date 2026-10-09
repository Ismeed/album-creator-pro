import type { ParticipantEntry } from "@/types/album-templates";
import type { StoredSchemaConfig } from "@/types/field-schemas";
import { getDisplayFields } from "@/types/album-templates";
import { useSignedPhotoUrl } from "@/hooks/useSignedPhotoUrl";
import { Loader2 } from "lucide-react";

function valueOf(participant: ParticipantEntry, key: string) { const value = participant[key as keyof ParticipantEntry]; return typeof value === "string" ? value : undefined; }

export function MomentumCard({ participant, schemaConfig }: { participant: ParticipantEntry; schemaConfig?: StoredSchemaConfig }) {
  const { signedUrl, isLoading } = useSignedPhotoUrl(participant.processedPhotoUrl || participant.photoUrl);
  const fields = getDisplayFields(schemaConfig).map((key) => valueOf(participant, key)).filter(Boolean).slice(0, 2);
  return <article className="participant-card relative overflow-hidden border border-[#3b332a] bg-[#171512] text-[#f3eadb] shadow-[0_16px_35px_-22px_rgba(0,0,0,0.8)]"><div className="flex gap-4 p-4">{isLoading || !signedUrl ? <div className="flex size-24 items-center justify-center bg-[#2a251f]"><Loader2 className="animate-spin text-[#c7a76b]" /></div> : <img src={signedUrl} alt={participant.fullName} className="size-24 object-cover object-top" loading="lazy" />}<div className="min-w-0 flex-1"><p className="mb-2 text-[9px] uppercase tracking-[0.3em] text-[#c7a76b]">Profile</p><h3 className="truncate font-serif text-lg">{participant.fullName}</h3>{fields.map((field) => <p key={field} className="mt-1 truncate text-xs text-[#bdb1a0]">{field}</p>)}</div></div>{participant.quote && <p className="border-t border-[#3b332a] px-4 py-3 font-serif text-xs italic text-[#bdb1a0]">“{participant.quote}”</p>}</article>;
}

export function MomentumCover({ title, institutionName, albumType, year, logoUrl }: { title: string; institutionName?: string; albumType: string; year: string; logoUrl?: string }) {
  return <div className="album-page album-cover relative flex min-h-[297mm] flex-col overflow-hidden bg-[#171512] text-[#f3eadb] print:break-after-page"><div className="absolute -right-24 top-20 size-80 rounded-full border border-[#c7a76b]/30" /><div className="absolute -right-16 top-28 size-64 rounded-full border border-[#c7a76b]/20" /><div className="relative flex flex-1 flex-col justify-between p-16"><div className="flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-[#c7a76b]"><span>Vol. {year}</span><span>Archive</span></div><div className="max-w-2xl">{logoUrl && <img src={logoUrl} alt="Logo" className="mb-8 size-20 object-contain" />}<p className="mb-5 text-xs uppercase tracking-[0.45em] text-[#c7a76b]">{albumType}</p><h1 className="font-serif text-7xl font-medium leading-[0.9] tracking-[-0.04em]">{title}</h1>{institutionName && <p className="mt-8 max-w-md border-l border-[#c7a76b] pl-4 text-lg text-[#bdb1a0]">{institutionName}</p>}</div><div className="flex items-center gap-4 text-xs uppercase tracking-[0.3em] text-[#c7a76b]"><span className="h-px w-16 bg-[#c7a76b]" /><span>Private collection</span></div></div></div>;
}

export function MomentumGrid({ participants, schemaConfig }: { participants: ParticipantEntry[]; schemaConfig?: StoredSchemaConfig }) {
  const pages: ParticipantEntry[][] = []; for (let i = 0; i < participants.length; i += 8) pages.push(participants.slice(i, i + 8));
  return <div className="participant-pages">{pages.map((page, index) => <div key={index} className="album-page min-h-[297mm] bg-[#171512] p-10 text-[#f3eadb] print:break-after-page"><div className="mb-8 flex items-center justify-between border-b border-[#3b332a] pb-5"><div><p className="text-[10px] uppercase tracking-[0.35em] text-[#c7a76b]">Archive / {String(index + 1).padStart(2, "0")}</p><h2 className="mt-2 font-serif text-3xl">The people</h2></div><span className="text-xs text-[#bdb1a0]">{String(page.length).padStart(2, "0")} profiles</span></div><div className="grid grid-cols-2 gap-5">{page.map((participant) => <MomentumCard key={participant.id} participant={participant} schemaConfig={schemaConfig} />)}</div></div>)}</div>;
}
