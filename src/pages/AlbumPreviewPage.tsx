import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Printer, Eye, Grid3X3, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlbumTemplate } from "@/components/album-templates/AlbumTemplate";
import { useAlbumTemplateData } from "@/hooks/useAlbumTemplateData";
import { ALBUM_TEMPLATES } from "@/types/album-templates";

export default function AlbumPreviewPage() {
  const { albumId } = useParams<{ albumId: string }>();
  const [selectedTemplate, setSelectedTemplate] = useState("classic");
  const [previewMode, setPreviewMode] = useState<"full" | "pages">("full");

  const { templateData, isLoading, error, totalSubmissions, eligibleCount } =
    useAlbumTemplateData(albumId, selectedTemplate);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  if (error || !templateData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">
            Failed to load album
          </h2>
          <p className="text-muted-foreground mb-4">
            {error?.message || "Album not found"}
          </p>
          <Button asChild variant="outline">
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header - Hidden when printing */}
      <header className="bg-background border-b border-border sticky top-0 z-40 no-print">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link to={`/album/${albumId}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Album
                </Link>
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Album Preview
                </h1>
                <p className="text-sm text-muted-foreground">
                  {templateData.cover.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Stats */}
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">
                  {eligibleCount} / {totalSubmissions} included
                </Badge>
              </div>

              {/* Template selector */}
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="w-40">
                  <LayoutTemplate className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALBUM_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View mode toggle */}
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <Button
                  variant={previewMode === "full" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-none"
                  onClick={() => setPreviewMode("full")}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant={previewMode === "pages" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-none"
                  onClick={() => setPreviewMode("pages")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
              </div>

              {/* Actions */}
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button size="sm" disabled>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Preview Container */}
      <main className="container max-w-5xl mx-auto px-4 py-8 no-print">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            bg-background shadow-2xl rounded-lg overflow-hidden mx-auto
            ${previewMode === "pages" ? "max-w-[210mm]" : ""}
          `}
          style={previewMode === "pages" ? { width: "210mm" } : {}}
        >
          <AlbumTemplate data={templateData} showWatermark />
        </motion.div>
      </main>

      {/* Print-only content */}
      <div className="hidden print:block">
        <AlbumTemplate data={templateData} />
      </div>
    </div>
  );
}
