import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Mail, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface EmailVerificationBannerProps {
  email: string;
  fullName: string;
}

export function EmailVerificationBanner({ email, fullName }: EmailVerificationBannerProps) {
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to resend email");
      }

      toast({
        title: "Email sent!",
        description: "Check your inbox for the verification link.",
      });
    } catch (err) {
      toast({
        title: "Failed to send",
        description: "Please try again in a few minutes.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-6"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-accent" />
            Verify Your Email
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Please verify your email address to create and manage albums. 
            Check your inbox at <span className="font-medium text-foreground">{email}</span>
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResendEmail}
            disabled={isResending}
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend Verification Email
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
