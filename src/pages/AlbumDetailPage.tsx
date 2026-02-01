import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  X,
  Loader2,
  ExternalLink
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
import { useAlbumSubmissions, useUpdateSubmissionStatus, useDeleteSubmission } from "@/hooks/useSubmissions";
import { useToast } from "@/hooks/use-toast";

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

  const { data: album, isLoading: albumLoading, error: albumError } = useAlbum(albumId);
  const { data: submissions = [], isLoading: submissionsLoading } = useAlbumSubmissions(albumId);
  const lockMutation = useLockAlbum();
  const deleteMutation = useDeleteAlbum();
  const updateStatusMutation = useUpdateSubmissionStatus();
  const deleteSubmissionMutation = useDeleteSubmission();

  const publicLink = `${window.location.origin}/submit/${albumId}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(publicLink);
    setShowLinkCopied(true);
    toast({ title: "Copied!", description: "Public upload link copied to clipboard." });
    setTimeout(() => setShowLinkCopied(false), 2000);
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
      toast({ title: "Approved", description: "Submission has been approved." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to approve submission.", variant: "destructive" });
    }
  };

  const handleReject = async (submissionId: string) => {
    try {
      await updateStatusMutation.mutateAsync({ submissionId, approvalStatus: "rejected" });
      toast({ title: "Rejected", description: "Submission has been rejected." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to reject submission.", variant: "destructive" });
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
        </div>
      </header>

      <div className="mobile-container py-6 space-y-6">
        {/* Status & Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-gradient rounded-xl p-5 shadow-card border border-border/50"
        >
          <div className="flex items-center gap-2 mb-4">
            {album.is_locked ? (
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                <Lock className="w-3 h-3 mr-1" />
                Locked
              </Badge>
            ) : isDeadlinePassed ? (
              <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                Deadline Passed
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-success/10 text-success">
                <LockOpen className="w-3 h-3 mr-1" />
                Open for Submissions
              </Badge>
            )}
          </div>

          <div className="space-y-3 text-sm">
            {album.institution_name && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span>{album.institution_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{albumTypeLabels[album.album_type] || album.album_type}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span>
                {paymentModeLabels[album.payment_mode]}
                {album.payment_mode === "participant_pays" && album.price_per_participant && (
                  <> · ${album.price_per_participant}/person</>
                )}
              </span>
            </div>
            {album.submission_deadline && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Deadline: {new Date(album.submission_deadline).toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Image className="w-4 h-4" />
              <span>{album.submission_count} submission{album.submission_count !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </motion.div>

        {/* Public Link */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
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
              disabled={album.is_locked}
              className="shrink-0"
            >
              {showLinkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          {album.is_locked && (
            <p className="text-xs text-muted-foreground mt-2">
              Album is locked. Unlock to allow submissions.
            </p>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <Button
            variant="outline"
            onClick={handleToggleLock}
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
                  This will permanently delete the album and all {album.submission_count} submission{album.submission_count !== 1 ? 's' : ''}. This action cannot be undone.
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
          transition={{ delay: 0.15 }}
        >
          <h3 className="font-semibold text-foreground mb-4">
            Submissions ({submissions.length})
          </h3>

          {submissionsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No submissions yet</p>
              <p className="text-sm">Share the public link to collect photos.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="card-gradient rounded-xl p-4 shadow-card border border-border/50"
                >
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                      <img
                        src={submission.photo_url}
                        alt="Submission"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {submission.participant?.full_name || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(submission.submitted_at).toLocaleString()}
                      </p>
                      <Badge
                        variant="outline"
                        className={`mt-1 text-xs ${
                          submission.approval_status === "approved"
                            ? "bg-success/10 text-success border-success/20"
                            : submission.approval_status === "rejected"
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : ""
                        }`}
                      >
                        {submission.approval_status}
                      </Badge>
                    </div>
                  </div>

                  {submission.approval_status === "pending" && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-success border-success/20 hover:bg-success/10"
                        onClick={() => handleApprove(submission.id)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/10"
                        onClick={() => handleReject(submission.id)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
};

export default AlbumDetailPage;
