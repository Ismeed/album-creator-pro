import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Lock, Eye, EyeOff, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
  confirmPassword: z
    .string()
    .min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

type TokenStatus = "loading" | "valid" | "invalid" | "expired" | "used";

const ResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token || token.length !== 64) {
        setTokenStatus("invalid");
        setErrorMessage("This reset link is invalid.");
        return;
      }

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        const response = await fetch(`${supabaseUrl}/functions/v1/validate-reset-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: apiKey,
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.valid) {
          setTokenStatus("valid");
        } else {
          if (data.error?.includes("expired")) {
            setTokenStatus("expired");
            setErrorMessage("This reset link has expired. Please request a new one.");
          } else if (data.error?.includes("already been used")) {
            setTokenStatus("used");
            setErrorMessage("This reset link has already been used.");
          } else {
            setTokenStatus("invalid");
            setErrorMessage("This reset link is invalid or has expired.");
          }
        }
      } catch (error) {
        console.error("Error validating token:", error);
        setTokenStatus("invalid");
        setErrorMessage("Unable to validate reset link. Please try again.");
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    setIsSubmitting(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify({ token, newPassword: data.password }),
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        toast({
          title: "Password reset successful",
          description: "You can now log in with your new password.",
        });
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 3000);
      } else {
        toast({
          title: "Reset failed",
          description: result.error || "Failed to reset password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Reset failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (tokenStatus === "loading") {
    return (
      <main className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent" />
          <p className="text-muted-foreground">Validating reset link...</p>
        </div>
      </main>
    );
  }

  // Invalid/expired/used token state
  if (tokenStatus !== "valid" && !isSuccess) {
    return (
      <main className="min-h-[100dvh] bg-background flex flex-col safe-top safe-bottom">
        <header className="p-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to login</span>
          </Link>
        </header>

        <div className="flex-1 flex items-center justify-center px-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-sm space-y-8 text-center"
          >
            <div className="space-y-2">
              <span className="text-accent font-bold text-2xl">OLEX</span>
            </div>
            
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-foreground">Invalid Reset Link</h1>
              <p className="text-muted-foreground text-sm">{errorMessage}</p>
            </div>

            <div className="space-y-3">
              <Link to="/forgot-password">
                <Button variant="accent" className="w-full">
                  Request new reset link
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Return to login
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <main className="min-h-[100dvh] bg-background flex flex-col safe-top safe-bottom">
        <div className="flex-1 flex items-center justify-center px-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm space-y-8 text-center"
          >
            <div className="space-y-2">
              <span className="text-accent font-bold text-2xl">OLEX</span>
            </div>
            
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-accent" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-foreground">Password Reset Successful!</h1>
              <p className="text-muted-foreground text-sm">
                Your password has been updated. Redirecting to login...
              </p>
            </div>

            <Link to="/login">
              <Button variant="accent" className="w-full">
                Go to login now
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>
    );
  }

  // Valid token - show reset form
  return (
    <main className="min-h-[100dvh] bg-background flex flex-col safe-top safe-bottom">
      <header className="p-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to login</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm space-y-8"
        >
          <div className="text-center space-y-2">
            <span className="text-accent font-bold text-2xl">OLEX</span>
            <h1 className="text-2xl font-bold text-foreground">
              Set new password
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className="pl-11 pr-11 h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className="pl-11 pr-11 h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Password must be at least 8 characters long.
            </p>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Resetting password...
                </>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </main>
  );
};

export default ResetPasswordPage;
