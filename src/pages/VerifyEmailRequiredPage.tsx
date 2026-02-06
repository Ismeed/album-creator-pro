import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Loader2, RefreshCw, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganizerProfile } from "@/hooks/useOrganizerProfile";
import { useToast } from "@/hooks/use-toast";

/**
 * Full-page verification required screen.
 * Blocks unverified users from accessing protected features.
 */
const VerifyEmailRequiredPage = () => {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { data: organizer, refetch } = useOrganizerProfile();
  const [isResending, setIsResending] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);

  const email = organizer?.email || user?.email || "";
  const fullName = organizer?.full_name || user?.user_metadata?.full_name || "";

  // Rate limiting: 60 seconds between resends
  const canResend = !lastSentAt || Date.now() - lastSentAt > 60000;
  const secondsUntilResend = lastSentAt 
    ? Math.max(0, Math.ceil((60000 - (Date.now() - lastSentAt)) / 1000))
    : 0;

  const handleResendEmail = async () => {
    if (!canResend) {
      toast({
        title: "Please wait",
        description: `You can resend in ${secondsUntilResend} seconds.`,
      });
      return;
    }

    setIsResending(true);
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !apiKey) {
        throw new Error("Configuration error");
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/resend-verification-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend email");
      }

      setLastSentAt(Date.now());
      toast({
        title: "Email sent!",
        description: "Check your inbox for the verification link.",
      });
    } catch (err) {
      console.error("Resend verification error:", err);
      toast({
        title: "Failed to send",
        description: "Please try again in a few minutes.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    await refetch();
    
    if (organizer?.is_verified) {
      toast({
        title: "Email verified!",
        description: "Redirecting to dashboard...",
      });
      // Small delay then redirect
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } else {
      toast({
        title: "Not yet verified",
        description: "Please check your email and click the verification link.",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <main className="min-h-[100dvh] bg-background safe-top safe-bottom flex items-center justify-center">
      <div className="mobile-container py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto"
          >
            <Mail className="w-10 h-10 text-accent" />
          </motion.div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Verify Your Email
            </h1>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {fullName && `Hi ${fullName}! `}
              Please verify your email to access all features of Olex Studio.
            </p>
          </div>

          {/* Email display */}
          <div className="bg-muted/50 rounded-xl p-4 max-w-sm mx-auto">
            <p className="text-sm text-muted-foreground mb-1">
              Verification email sent to:
            </p>
            <p className="font-medium text-foreground">{email}</p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 text-left bg-accent/5 border border-accent/20 rounded-xl p-4 max-w-sm mx-auto">
            <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">Required to continue</p>
              <p className="text-muted-foreground">
                You must verify your email before you can create albums or access dashboard features.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 max-w-sm mx-auto">
            <Button
              onClick={handleCheckVerification}
              variant="accent"
              size="lg"
              className="w-full"
            >
              I've Verified My Email
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <Button
              onClick={handleResendEmail}
              variant="outline"
              size="lg"
              className="w-full"
              disabled={isResending || !canResend}
            >
              {isResending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : !canResend ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Resend in {secondsUntilResend}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>
          </div>

          {/* Sign out link */}
          <p className="text-sm text-muted-foreground">
            Wrong account?{" "}
            <button
              onClick={handleSignOut}
              className="text-accent hover:underline font-medium"
            >
              Sign out
            </button>
          </p>
        </motion.div>
      </div>
    </main>
  );
};

export default VerifyEmailRequiredPage;
