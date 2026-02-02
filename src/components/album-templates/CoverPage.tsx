import type { CoverPageData } from "@/types/album-templates";

interface CoverPageProps {
  data: CoverPageData;
  variant?: "classic" | "modern";
}

export function CoverPage({ data, variant = "classic" }: CoverPageProps) {
  if (variant === "modern") {
    return <ModernCover data={data} />;
  }
  return <ClassicCover data={data} />;
}

function ClassicCover({ data }: { data: CoverPageData }) {
  return (
    <div className="album-page album-cover flex flex-col items-center justify-center min-h-[297mm] bg-background text-foreground p-16 text-center print:break-after-page">
      {/* Optional logo placeholder */}
      {data.logoUrl && (
        <div className="mb-12">
          <img
            src={data.logoUrl}
            alt="Institution logo"
            className="w-32 h-32 object-contain mx-auto"
          />
        </div>
      )}

      {/* Institution name */}
      {data.institutionName && (
        <p className="text-lg tracking-widest uppercase text-muted-foreground mb-6">
          {data.institutionName}
        </p>
      )}

      {/* Main title */}
      <h1 className="text-5xl font-bold tracking-tight mb-4 text-foreground">
        {data.title}
      </h1>

      {/* Album type badge */}
      <p className="text-xl text-muted-foreground mb-8">
        {data.albumType}
      </p>

      {/* Decorative divider */}
      <div className="w-24 h-0.5 bg-border mb-8" />

      {/* Year */}
      <p className="text-3xl font-light text-muted-foreground">
        {data.year}
      </p>
    </div>
  );
}

function ModernCover({ data }: { data: CoverPageData }) {
  return (
    <div className="album-page album-cover flex flex-col min-h-[297mm] bg-background text-foreground print:break-after-page">
      {/* Top accent bar */}
      <div className="h-2 bg-primary w-full" />

      <div className="flex-1 flex flex-col items-center justify-center p-16 text-center">
        {/* Logo */}
        {data.logoUrl && (
          <div className="mb-10">
            <img
              src={data.logoUrl}
              alt="Institution logo"
              className="w-28 h-28 object-contain mx-auto"
            />
          </div>
        )}

        {/* Year badge */}
        <div className="inline-block px-6 py-2 bg-muted rounded-full mb-8">
          <span className="text-lg font-medium text-muted-foreground">{data.year}</span>
        </div>

        {/* Main title */}
        <h1 className="text-6xl font-extrabold tracking-tight mb-6 text-foreground">
          {data.title}
        </h1>

        {/* Institution & type */}
        <div className="space-y-2">
          {data.institutionName && (
            <p className="text-xl text-muted-foreground">
              {data.institutionName}
            </p>
          )}
          <p className="text-lg font-medium text-primary">
            {data.albumType}
          </p>
        </div>
      </div>

      {/* Bottom accent bar */}
      <div className="h-2 bg-primary w-full" />
    </div>
  );
}
