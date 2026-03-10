import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2, XCircle } from "lucide-react";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setError("Verification token is missing");
        return;
      }

      if (!supabaseUrl || !apiKey) {
        setStatus("error");
        setError("Configuration error");
        return;
      }

      try {
        const response = await fetch(
          `${supabaseUrl}/functions/v1/verify-email?token=${encodeURIComponent(token)}`,
          {
            headers: { apikey: apiKey },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setStatus("error");
          setError(data.error || "Verification failed");
          return;
        }

        // On success or already verified, redirect to success page
        navigate("/verified-success", { replace: true });
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("error");
        setError("Unable to verify email. Please try again.");
      }
    };

    verifyEmail();
  }, [token, supabaseUrl, apiKey, navigate]);

  return (
    <main className="min-h-[100dvh] bg-background safe-top safe-bottom flex items-center justify-center">
      <div className="mobile-container py-12 text-center">
        {status === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto" />
            <p className="text-muted-foreground">Verifying your email...</p>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Verification Failed
              </h1>
              <p className="text-muted-foreground max-w-xs mx-auto">
                {error || "The verification link is invalid or has expired."}
              </p>
            </div>

            <div className="space-y-3">
              <Button asChild variant="outline">
                <Link to="/login">
                  Back to Login
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
};

export default VerifyEmailPage;
