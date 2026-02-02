import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Eye, 
  Grid3X3, 
  LayoutTemplate,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlbumTemplate } from "@/components/album-templates/AlbumTemplate";
import { useAlbumTemplateData } from "@/hooks/useAlbumTemplateData";
import { useAlbumGeneration, formatFileSize } from "@/hooks/useAlbumGeneration";
import { ALBUM_TEMPLATES } from "@/types/album-templates";
import { useToast } from "@/hooks/use-toast";

export default function AlbumPreviewPage() {
  const { albumId } = useParams<{ albumId: string }>();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState("classic");
  const [previewMode, setPreviewMode] = useState<"full" | "pages">("full");
  const [isDownloading, setIsDownloading] = useState(false);

  const { templateData, isLoading, error, totalSubmissions, eligibleCount } =
    useAlbumTemplateData(albumId, selectedTemplate);

  const {
    generation,
    isLoadingGeneration,
    conditions,
    isLoadingConditions,
    startGeneration,
    isStarting,
    getDownloadUrl,
  } = useAlbumGeneration(albumId);

  const handlePrint = () => {
    window.print();
  };

  const handleGenerate = () => {
    startGeneration({ templateId: selectedTemplate });
  };

  const handleDownload = async () => {
    if (!generation?.file_path) return;

    setIsDownloading(true);
    try {
      const url = await getDownloadUrl(generation.file_path);
      if (url) {
        // Create a temporary link and trigger download
        const link = document.createElement("a");
        link.href = url;
        link.download = `${templateData?.cover.title || "album"}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Download started", description: "Your PDF is downloading." });
      } else {
        toast({ title: "Download failed", description: "Could not get download URL", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Download failed", description: "An error occurred", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const isGenerating = generation?.status === "generating" || generation?.status === "pending";
  const isCompleted = generation?.status === "completed";
  const isFailed = generation?.status === "failed";

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

            <div className="flex items-center gap-3 flex-wrap">
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

              {/* Print */}
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Generation Panel - Hidden when printing */}
      <div className="bg-background border-b border-border no-print">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <h2 className="font-medium text-foreground">PDF Generation</h2>
                <p className="text-sm text-muted-foreground">
                  {isLoadingConditions ? (
                    "Checking conditions..."
                  ) : conditions?.canGenerate ? (
                    "Ready to generate"
                  ) : (
                    "Requirements not met"
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Generation Status */}
              {isLoadingGeneration ? (
                <Badge variant="secondary">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Loading...
                </Badge>
              ) : isGenerating ? (
                <Badge variant="secondary" className="bg-accent/10 text-accent">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Generating...
                </Badge>
              ) : isCompleted ? (
                <Badge variant="secondary" className="bg-success/10 text-success">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completed
                  {generation?.file_size_bytes && (
                    <span className="ml-1">({formatFileSize(generation.file_size_bytes)})</span>
                  )}
                </Badge>
              ) : isFailed ? (
                <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  Failed
                </Badge>
              ) : null}

              {/* Actions */}
              {isCompleted && generation?.file_path ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isStarting || isGenerating || !conditions?.canGenerate}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDownload}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Download PDF
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isStarting || isGenerating || !conditions?.canGenerate}
                >
                  {isStarting || isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isStarting ? "Starting..." : "Generating..."}
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Album
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Missing conditions alert */}
          {conditions && !conditions.canGenerate && (
            <Alert variant="default" className="mt-4 border-amber-500/20 bg-amber-500/5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-600">Cannot generate yet</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-1 text-sm">
                  {conditions.missingConditions.map((condition, i) => (
                    <li key={i}>{condition}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Error message */}
          {isFailed && generation?.error_message && (
            <Alert variant="destructive" className="mt-4">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Generation failed</AlertTitle>
              <AlertDescription>{generation.error_message}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

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
