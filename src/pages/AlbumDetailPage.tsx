import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Copy, 
  Lock, 
  LockOpen, 
  Trash2, 
  Edit2,
  Image,
  Calendar,
  Building2,
  Users,
  DollarSign,
  Check,
  Loader2,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAlbum, useLockAlbum, useDeleteAlbum } from "@/hooks/useAlbums";
import { useAlbumSubmissions, useUpdateSubmissionStatus, useDeleteSubmission, type SubmissionWithParticipant } from "@/hooks/useSubmissions";
import { useToast } from "@/hooks/use-toast";
import { SubmissionCard, SubmissionDetailSheet } from "@/components/album/SubmissionCard";

const albumTypeLabels: Record<string, string> = {
  class: "Class",
  department: "Department",
  faculty: "Faculty",
  training: "Training",
  bootcamp: "Bootcamp",
  other: "Other",
};

const paymentModeLabels: Record<string, string> = {
  organizer_pays: "Organizer Pays",
  participant_pays: "Participant Pays",
};

const AlbumDetailPage = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showLinkCopied, setShowLinkCopied] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithParticipant | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const { data: album, isLoading: albumLoading, error: albumError, refetch: refetchAlbum } = useAlbum(albumId);
  const { data: submissions = [], isLoading: submissionsLoading, refetch: refetchSubmissions } = useAlbumSubmissions(albumId);
  const lockMutation = useLockAlbum();
  const deleteMutation = useDeleteAlbum();
  const updateStatusMutation = useUpdateSubmissionStatus();
  const deleteSubmissionMutation = useDeleteSubmission();

  const publicLink = `${window.location.origin}/submit/${albumId}`;

  // Filter submissions based on active tab
  const filteredSubmissions = useMemo(() => {
    switch (activeTab) {
      case "pending":
        return submissions.filter(s => s.approval_status === "pending");
      case "approved":
        return submissions.filter(s => s.approval_status === "approved");
      case "rejected":
        return submissions.filter(s => s.approval_status === "rejected");
      default:
        return submissions;
    }
  }, [submissions, activeTab]);

  // Stats
  const stats = useMemo(() => ({
    total: submissions.length,
    pending: submissions.filter(s => s.approval_status === "pending").length,
    approved: submissions.filter(s => s.approval_status === "approved").length,
    rejected: submissions.filter(s => s.approval_status === "rejected").length,
    paid: submissions.filter(s => s.payment_status === "successful").length,
  }), [submissions]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(publicLink);
    setShowLinkCopied(true);
    toast({ title: "Copied!", description: "Public upload link copied to clipboard." });
    setTimeout(() => setShowLinkCopied(false), 2000);
  };

  const handleRefresh = () => {
    refetchAlbum();
    refetchSubmissions();
    toast({ title: "Refreshed", description: "Data has been updated." });
  };

  const handleToggleLock = async () => {
    if (!album) return;
    try {
      await lockMutation.mutateAsync({ albumId: album.id, isLocked: !album.is_locked });
      toast({
        title: album.is_locked ? "Album unlocked" : "Album locked",
        description: album.is_locked 
          ? "Participants can now submit photos." 
          : "No new submissions allowed.",
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update album.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!album) return;
    try {
      await deleteMutation.mutateAsync(album.id);
      toast({ title: "Album deleted", description: "The album and all submissions have been removed." });
      navigate("/dashboard");
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete album.", variant: "destructive" });
    }
  };

  const handleApprove = async (submissionId: string) => {
    try {
      await updateStatusMutation.mutateAsync({ submissionId, approvalStatus: "approved" });
      toast({ title: "Approved", description: "Submission has been approved and will appear in the final album." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to approve submission.", variant: "destructive" });
    }
  };

  const handleReject = async (submissionId: string) => {
    try {
      await updateStatusMutation.mutateAsync({ submissionId, approvalStatus: "rejected" });
      toast({ title: "Rejected", description: "Submission has been rejected and will be excluded from the album." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to reject submission.", variant: "destructive" });
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!albumId) return;
    try {
      await deleteSubmissionMutation.mutateAsync({ submissionId, albumId });
      toast({ title: "Deleted", description: "Submission has been permanently removed." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete submission.", variant: "destructive" });
    }
  };

  if (albumLoading) {
    return (
      <main className="min-h-[100dvh] bg-background safe-top safe-bottom flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </main>
    );
  }

  if (albumError || !album) {
    return (
      <main className="min-h-[100dvh] bg-background safe-top safe-bottom">
        <div className="mobile-container py-12 text-center">
          <p className="text-muted-foreground mb-4">Album not found or you don't have access.</p>
          <Button asChild variant="outline">
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  const isDeadlinePassed = album.submission_deadline 
    ? new Date(album.submission_deadline) < new Date()
    : false;

  const canAcceptSubmissions = !album.is_locked && !isDeadlinePassed;

  return (
    <main className="min-h-[100dvh] bg-background safe-top safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="mobile-container flex items-center h-16">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors -ml-2 p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold text-foreground ml-2 truncate flex-1">{album.title}</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="mobile-container py-6 space-y-6">
        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 ${
            album.is_locked 
              ? "bg-muted border border-border" 
              : canAcceptSubmissions
              ? "bg-success/10 border border-success/20"
              : "bg-destructive/10 border border-destructive/20"
          }`}
        >
          <div className="flex items-center gap-3">
            {album.is_locked ? (
              <Lock className="w-5 h-5 text-muted-foreground" />
            ) : canAcceptSubmissions ? (
              <LockOpen className="w-5 h-5 text-success" />
            ) : (
              <Clock className="w-5 h-5 text-destructive" />
            )}
            <div>
              <p className="font-medium text-foreground">
                {album.is_locked 
                  ? "Album Locked" 
                  : canAcceptSubmissions 
                  ? "Accepting Submissions" 
                  : "Deadline Passed"}
              </p>
              <p className="text-xs text-muted-foreground">
                {album.is_locked 
                  ? "No new submissions or edits allowed" 
                  : canAcceptSubmissions 
                  ? "Participants can submit their photos"
                  : "Submission window has closed"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Album Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card-gradient rounded-xl p-5 shadow-card border border-border/50"
        >
          <div className="space-y-3 text-sm">
            {album.institution_name && (
              <div className="flex items-center gap-2 text-foreground">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span>{album.institution_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-foreground">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{albumTypeLabels[album.album_type] || album.album_type}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span>
                {paymentModeLabels[album.payment_mode]}
                {album.payment_mode === "participant_pays" && album.price_per_participant && (
                  <span className="text-muted-foreground"> · ${album.price_per_participant}/person</span>
                )}
              </span>
            </div>
            {album.submission_deadline && (
              <div className="flex items-center gap-2 text-foreground">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  Deadline: {new Date(album.submission_deadline).toLocaleString()}
                  {isDeadlinePassed && (
                    <Badge variant="outline" className="ml-2 text-destructive border-destructive/20">
                      Passed
                    </Badge>
                  )}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-2"
        >
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="rounded-lg bg-accent/10 p-3 text-center">
            <p className="text-2xl font-bold text-accent">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="rounded-lg bg-success/10 p-3 text-center">
            <p className="text-2xl font-bold text-success">{stats.approved}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </div>
          <div className="rounded-lg bg-destructive/10 p-3 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </div>
        </motion.div>

        {/* Public Link */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card-gradient rounded-xl p-5 shadow-card border border-border/50"
        >
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Public Upload Link
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={publicLink}
              className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg border border-border truncate"
            />
            <Button
              variant={showLinkCopied ? "accent" : "outline"}
              size="sm"
              onClick={copyLink}
              className="shrink-0"
            >
              {showLinkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          {!canAcceptSubmissions && (
            <p className="text-xs text-muted-foreground mt-2">
              {album.is_locked ? "Album is locked." : "Deadline has passed."} Link is inactive.
            </p>
          )}
        </motion.div>

        {/* Album Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={lockMutation.isPending}
              >
                {lockMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : album.is_locked ? (
                  <LockOpen className="w-4 h-4 mr-2" />
                ) : (
                  <Lock className="w-4 h-4 mr-2" />
                )}
                {album.is_locked ? "Unlock" : "Lock"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm mx-4">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {album.is_locked ? "Unlock album?" : "Lock album?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {album.is_locked 
                    ? "This will allow participants to submit new photos again."
                    : "This will prevent any new submissions or edits. Locking is required before generating the final album."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleToggleLock}>
                  {album.is_locked ? "Unlock" : "Lock Album"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button asChild variant="outline">
            <Link to={`/album/${album.id}/edit`}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="col-span-2">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Album
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm mx-4">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this album?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the album and all {stats.total} submission{stats.total !== 1 ? 's' : ''}. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>

        {/* Submissions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-4">
              <TabsTrigger value="all" className="text-xs">
                All ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {stats.pending}
              </TabsTrigger>
              <TabsTrigger value="approved" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                {stats.approved}
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs">
                <XCircle className="w-3 h-3 mr-1" />
                {stats.rejected}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {submissionsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No {activeTab !== "all" ? activeTab : ""} submissions</p>
                  {activeTab === "all" && (
                    <p className="text-sm">Share the public link to collect photos.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSubmissions.map((submission) => (
                    <SubmissionCard
                      key={submission.id}
                      submission={submission}
                      isLocked={album.is_locked}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onDelete={handleDeleteSubmission}
                      onViewDetails={setSelectedSubmission}
                      isUpdating={updateStatusMutation.isPending}
                      isDeleting={deleteSubmissionMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Submission Detail Sheet */}
      <SubmissionDetailSheet
        submission={selectedSubmission}
        isOpen={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        isLocked={album.is_locked}
        onApprove={handleApprove}
        onReject={handleReject}
        onDelete={handleDeleteSubmission}
        isUpdating={updateStatusMutation.isPending}
        isDeleting={deleteSubmissionMutation.isPending}
      />
    </main>
  );
};

export default AlbumDetailPage;
