import type { ParticipantEntry } from "@/types/album-templates";
import type { StoredSchemaConfig } from "@/types/field-schemas";
import { getDisplayFields } from "@/types/album-templates";
import { useSignedPhotoUrl } from "@/hooks/useSignedPhotoUrl";
import { Loader2 } from "lucide-react";

function valueOf(participant: ParticipantEntry, key: string) { const value = participant[key as keyof ParticipantEntry]; return typeof value === "string" ? value : undefined; }

export function SignatureCard({ participant, schemaConfig }: { participant: ParticipantEntry; schemaConfig?: StoredSchemaConfig }) {
  const { signedUrl, isLoading } = useSignedPhotoUrl(participant.processedPhotoUrl || participant.photoUrl);
  const fields = getDisplayFields(schemaConfig).map((key) => valueOf(participant, key)).filter(Boolean).slice(0, 3);
  return <article className="participant-card bg-white p-3 shadow-[0_15px_30px_-24px_rgba(0,0,0,0.6)]"><div className="relative aspect-[2/3] overflow-hidden bg-[#e4e1db]">{isLoading || !signedUrl ? <Loader2 className="absolute left-1/2 top-1/2 animate-spin text-[#68645e]" /> : <img src={signedUrl} alt={participant.fullName} className="h-full w-full object-cover object-top grayscale-[15%]" loading="lazy" />}<div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" /><h3 className="absolute inset-x-4 bottom-4 font-serif text-xl text-white">{participant.fullName}</h3></div><div className="px-2 pb-2 pt-4 text-center">{fields.length > 0 && <p className="text-[10px] uppercase tracking-[0.18em] text-[#68645e]">{fields.join("  •  ")}</p>}{participant.quote && <p className="mt-3 line-clamp-2 font-serif text-xs italic text-[#858078]">“{participant.quote}”</p>}</div></article>;
}

export function SignatureCover({ title, institutionName, albumType, year, logoUrl }: { title: string; institutionName?: string; albumType: string; year: string; logoUrl?: string }) {
  return <div className="album-page album-cover relative flex min-h-[297mm] flex-col overflow-hidden bg-[#e8e5df] text-[#22211f] print:break-after-page"><div className="absolute left-0 top-0 h-full w-5 bg-[#22211f]" /><div className="relative flex flex-1 flex-col items-center justify-center px-20 text-center"><div className="mb-10 flex items-center gap-5 text-[10px] uppercase tracking-[0.42em] text-[#68645e]"><span className="h-px w-12 bg-[#22211f]" />{year}<span className="h-px w-12 bg-[#22211f]" /></div>{logoUrl && <img src={logoUrl} alt="Logo" className="mb-10 size-28 object-contain mix-blend-multiply" />}<p className="mb-6 text-xs uppercase tracking-[0.38em] text-[#68645e]">{albumType}</p><h1 className="max-w-3xl font-serif text-7xl font-medium leading-[0.88] tracking-[-0.05em]">{title}</h1>{institutionName && <p className="mt-8 text-xl tracking-[0.12em] text-[#68645e]">{institutionName}</p>}</div><div className="relative mx-20 mb-14 border-t border-[#22211f] pt-4 text-left text-[10px] uppercase tracking-[0.3em] text-[#68645e]"><span>Selected works</span><span className="float-right">OLEX</span></div></div>;
}

export function SignatureGrid({ participants, schemaConfig }: { participants: ParticipantEntry[]; schemaConfig?: StoredSchemaConfig }) {
  const pages: ParticipantEntry[][] = []; for (let i = 0; i < participants.length; i += 4) pages.push(participants.slice(i, i + 4));
  return <div className="participant-pages">{pages.map((page, index) => <div key={index} className="album-page min-h-[297mm] bg-[#e8e5df] p-12 print:break-after-page"><div className="mb-10 flex items-center justify-between border-b border-[#b9b5ae] pb-4"><h2 className="font-serif text-3xl">Selected works</h2><span className="text-[10px] uppercase tracking-[0.25em] text-[#68645e]">{String(index + 1).padStart(2, "0")} / {String(pages.length).padStart(2, "0")}</span></div><div className="grid grid-cols-2 gap-8">{page.map((participant) => <SignatureCard key={participant.id} participant={participant} schemaConfig={schemaConfig} />)}</div></div>)}</div>;
}
