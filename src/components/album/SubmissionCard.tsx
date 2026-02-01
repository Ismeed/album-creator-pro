import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { 
  Check, 
  X, 
  Trash2, 
  Calendar, 
  User, 
  Building2,
  CreditCard,
  Loader2,
  Eye
} from "lucide-react";
import type { SubmissionWithParticipant } from "@/hooks/useSubmissions";

interface SubmissionCardProps {
  submission: SubmissionWithParticipant;
  isLocked: boolean;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onViewDetails: (submission: SubmissionWithParticipant) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function SubmissionCard({
  submission,
  isLocked,
  onApprove,
  onReject,
  onDelete,
  onViewDetails,
  isUpdating,
  isDeleting,
}: SubmissionCardProps) {
  const getApprovalBadge = () => {
    switch (submission.approval_status) {
      case "approved":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <Check className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <X className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
            Pending
          </Badge>
        );
    }
  };

  const getPaymentBadge = () => {
    switch (submission.payment_status) {
      case "successful":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CreditCard className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <CreditCard className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <CreditCard className="w-3 h-3 mr-1" />
            Unpaid
          </Badge>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-gradient rounded-xl p-4 shadow-card border transition-all ${
        submission.approval_status === "approved"
          ? "border-success/30"
          : submission.approval_status === "rejected"
          ? "border-destructive/30 opacity-60"
          : "border-border/50"
      }`}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <button 
          onClick={() => onViewDetails(submission)}
          className="w-20 h-20 rounded-lg bg-muted overflow-hidden shrink-0 relative group"
        >
          <img
            src={submission.photo_url}
            alt="Submission"
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
            <Eye className="w-5 h-5 text-background opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">
            {submission.participant?.full_name || "Unknown Participant"}
          </p>
          
          {submission.participant?.department_or_class && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Building2 className="w-3 h-3" />
              {submission.participant.department_or_class}
            </p>
          )}
          
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3" />
            {new Date(submission.submitted_at).toLocaleString()}
          </p>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {getApprovalBadge()}
            {getPaymentBadge()}
          </div>
        </div>
      </div>

      {/* Actions */}
      {!isLocked && submission.approval_status === "pending" && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-success border-success/20 hover:bg-success/10 hover:border-success/40"
            onClick={() => onApprove(submission.id)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4 mr-1" />
                Approve
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/40"
            onClick={() => onReject(submission.id)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <X className="w-4 h-4 mr-1" />
                Reject
              </>
            )}
          </Button>
        </div>
      )}

      {/* Delete action (always available for organizers if not locked) */}
      {!isLocked && (
        <div className="flex justify-end mt-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive h-8 px-2"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm mx-4">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete submission?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove this submission from {submission.participant?.full_name || "this participant"}. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(submission.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Locked indicator */}
      {isLocked && (
        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
          Album is locked. Actions disabled.
        </p>
      )}
    </motion.div>
  );
}

interface SubmissionDetailSheetProps {
  submission: SubmissionWithParticipant | null;
  isOpen: boolean;
  onClose: () => void;
  isLocked: boolean;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function SubmissionDetailSheet({
  submission,
  isOpen,
  onClose,
  isLocked,
  onApprove,
  onReject,
  onDelete,
  isUpdating,
  isDeleting,
}: SubmissionDetailSheetProps) {
  if (!submission) return null;

  const getApprovalBadge = () => {
    switch (submission.approval_status) {
      case "approved":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <Check className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <X className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
            Pending Review
          </Badge>
        );
    }
  };

  const getPaymentBadge = () => {
    switch (submission.payment_status) {
      case "successful":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CreditCard className="w-3 h-3 mr-1" />
            Payment Successful
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <CreditCard className="w-3 h-3 mr-1" />
            Payment Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <CreditCard className="w-3 h-3 mr-1" />
            Awaiting Payment
          </Badge>
        );
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>Submission Details</SheetTitle>
          <SheetDescription>
            Review and manage this submission
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 overflow-y-auto pb-6">
          {/* Full Photo */}
          <div className="rounded-xl overflow-hidden bg-muted aspect-square max-h-[40vh] mx-auto">
            <img
              src={submission.photo_url}
              alt="Submission"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Participant Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">
                  {submission.participant?.full_name || "Unknown Participant"}
                </p>
                {submission.participant?.department_or_class && (
                  <p className="text-sm text-muted-foreground">
                    {submission.participant.department_or_class}
                  </p>
                )}
                {submission.participant?.identifier && (
                  <p className="text-xs text-muted-foreground">
                    ID: {submission.participant.identifier}
                  </p>
                )}
              </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Approval</p>
                {getApprovalBadge()}
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Payment</p>
                {getPaymentBadge()}
              </div>
            </div>

            {/* Submission Date */}
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Submitted</p>
              <p className="text-sm font-medium text-foreground">
                {new Date(submission.submitted_at).toLocaleString()}
              </p>
            </div>

            {/* Background Color */}
            {submission.background_color && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Background Color</p>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded border border-border"
                    style={{ backgroundColor: submission.background_color }}
                  />
                  <span className="text-sm font-mono text-foreground">
                    {submission.background_color}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {!isLocked && (
            <div className="space-y-3 pt-4 border-t border-border">
              {submission.approval_status === "pending" && (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="text-success border-success/20 hover:bg-success/10"
                    onClick={() => onApprove(submission.id)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive/20 hover:bg-destructive/10"
                    onClick={() => onReject(submission.id)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              )}

              {submission.approval_status !== "pending" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Reset to pending
                  }}
                  disabled={isUpdating}
                >
                  Reset to Pending
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Submission
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-sm mx-4">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete submission?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove this submission. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        onDelete(submission.id);
                        onClose();
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {isLocked && (
            <p className="text-sm text-muted-foreground text-center pt-4 border-t border-border">
              Album is locked. No actions available.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
