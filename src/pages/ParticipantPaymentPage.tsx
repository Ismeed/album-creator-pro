import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Check, 
  X, 
  CreditCard,
  AlertCircle,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import { usePublicAlbum } from "@/hooks/usePublicAlbum";
import { useVerifyPayment, useInitializePayment } from "@/hooks/usePayment";
import { supabase } from "@/integrations/supabase/client";

const ParticipantPaymentPage = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reference = searchParams.get("reference");
  const trxref = searchParams.get("trxref");
  const submissionId = searchParams.get("submission_id");
  const email = searchParams.get("email");

  const paymentReference = reference || trxref;
  
  const { data: album, isLoading: albumLoading } = usePublicAlbum(albumId);
  const { data: verifyResult, isLoading: verifying, error: verifyError } = useVerifyPayment(paymentReference);
  const initPayment = useInitializePayment();

  const [submissionDetails, setSubmissionDetails] = useState<{
    participantName: string;
    photoUrl: string;
  } | null>(null);

  // Fetch submission details
  useEffect(() => {
    async function fetchSubmission() {
      if (!submissionId) return;

      const { data } = await supabase
        .from("submissions")
        .select(`
          photo_url,
          participant:participants!inner(full_name)
        `)
        .eq("id", submissionId)
        .single();

      if (data) {
        setSubmissionDetails({
          participantName: (data.participant as any)?.full_name || "",
          photoUrl: data.photo_url,
        });
      }
    }

    fetchSubmission();
  }, [submissionId]);

  const handleRetryPayment = () => {
    if (!submissionId || !email || !albumId) return;

    const callbackUrl = `${window.location.origin}/album/${albumId}/payment?submission_id=${submissionId}&email=${encodeURIComponent(email)}`;
    
    initPayment.mutate({
      submissionId,
      email,
      callbackUrl,
    });
  };

  // Loading states
  if (albumLoading) {
    return (
      <main className="min-h-[100dvh] bg-background safe-top safe-bottom flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </main>
    );
  }

  // Album not found
  if (!album) {
    return (
      <main className="min-h-[100dvh] bg-background safe-top safe-bottom">
        <div className="mobile-container py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Album Not Found</h1>
          <p className="text-muted-foreground">
            This album doesn't exist or the link is invalid.
          </p>
        </div>
      </main>
    );
  }

  // Verifying payment callback
  if (paymentReference && verifying) {
    return (
      <main className="min-h-[100dvh] bg-background safe-top safe-bottom">
        <header className="bg-primary text-primary-foreground py-6">
          <div className="mobile-container text-center">
            <span className="text-accent font-bold text-lg">OLEX</span>
            <h1 className="text-xl font-bold mt-2">{album.title}</h1>
          </div>
        </header>
        <div className="mobile-container py-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Verifying Payment</h2>
          <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
        </div>
      </main>
    );
  }

  // Payment verified successfully
  if (paymentReference && verifyResult?.success) {
    return (
      <main className="min-h-[100dvh] bg-background safe-top safe-bottom">
        <header className="bg-primary text-primary-foreground py-6">
          <div className="mobile-container text-center">
            <span className="text-accent font-bold text-lg">OLEX</span>
            <h1 className="text-xl font-bold mt-2">{album.title}</h1>
          </div>
        </header>
        <div className="mobile-container py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-success flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-10 h-10 text-success-foreground" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground max-w-xs mx-auto mb-6">
              Your payment of ₦{verifyResult.amount.toLocaleString()} has been confirmed.
            </p>

            {submissionDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8"
              >
                <div className="aspect-[3/4] max-w-[150px] mx-auto rounded-xl overflow-hidden shadow-card">
                  <img 
                    src={submissionDetails.photoUrl} 
                    alt="Your photo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {submissionDetails.participantName}
                </p>
              </motion.div>
            )}

            <div className="mt-8 p-4 rounded-xl bg-accent/10 border border-accent/20 max-w-xs mx-auto">
              <p className="text-sm text-foreground">
                Your photo will appear in the album after review.
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  // Payment failed or verification error
  if (paymentReference && (verifyError || (verifyResult && !verifyResult.success))) {
    return (
      <main className="min-h-[100dvh] bg-background safe-top safe-bottom">
        <header className="bg-primary text-primary-foreground py-6">
          <div className="mobile-container text-center">
            <span className="text-accent font-bold text-lg">OLEX</span>
            <h1 className="text-xl font-bold mt-2">{album.title}</h1>
          </div>
        </header>
        <div className="mobile-container py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <X className="w-10 h-10 text-destructive" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2">Payment Failed</h2>
            <p className="text-muted-foreground max-w-xs mx-auto mb-6">
              {verifyError?.message || "Your payment could not be processed. Please try again."}
            </p>

            <div className="space-y-3 max-w-xs mx-auto">
              <Button 
                variant="accent" 
                size="lg" 
                className="w-full"
                onClick={handleRetryPayment}
                disabled={initPayment.isPending || initPayment.isRedirecting}
              >
                {initPayment.isPending || initPayment.isRedirecting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Try Again
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full"
                onClick={() => navigate(`/album/${albumId}/submit`)}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Submission
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  // Default: Awaiting payment / Initialize payment page
  return (
    <main className="min-h-[100dvh] bg-background safe-top safe-bottom">
      <header className="bg-primary text-primary-foreground py-6">
        <div className="mobile-container text-center">
          <span className="text-accent font-bold text-lg">OLEX</span>
          <h1 className="text-xl font-bold mt-2">{album.title}</h1>
          {album.institution_name && (
            <p className="text-primary-foreground/70 text-sm mt-1">
              {album.institution_name}
            </p>
          )}
        </div>
      </header>

      <div className="mobile-container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Complete Payment</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Payment is required to include your photo in the album
            </p>
          </div>

          {/* Payment details card */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Album</span>
              <span className="font-medium text-foreground">{album.title}</span>
            </div>
            {album.institution_name && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Institution</span>
                <span className="text-foreground">{album.institution_name}</span>
              </div>
            )}
            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount to Pay</span>
                <span className="text-2xl font-bold text-foreground">
                  ₦{(album.price_per_participant || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {submissionDetails && (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
              <div className="w-16 h-20 rounded-lg overflow-hidden shrink-0">
                <img 
                  src={submissionDetails.photoUrl} 
                  alt="Your photo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-medium text-foreground">{submissionDetails.participantName}</p>
                <p className="text-sm text-muted-foreground">Your submission</p>
              </div>
            </div>
          )}

          {initPayment.error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{initPayment.error.message}</p>
              </div>
            </div>
          )}

          <Button 
            variant="accent" 
            size="lg" 
            className="w-full"
            onClick={handleRetryPayment}
            disabled={!submissionId || !email || initPayment.isPending || initPayment.isRedirecting}
          >
            {initPayment.isPending || initPayment.isRedirecting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {initPayment.isRedirecting ? "Redirecting to Paystack..." : "Processing..."}
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Pay ₦{(album.price_per_participant || 0).toLocaleString()}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secured by Paystack. Your payment details are safe.
          </p>
        </motion.div>
      </div>
    </main>
  );
};

export default ParticipantPaymentPage;
