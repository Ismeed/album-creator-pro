import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

const VerifiedSuccessPage = () => {
  return (
    <main className="min-h-[100dvh] bg-background safe-top safe-bottom flex items-center justify-center">
      <div className="mobile-container py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto"
          >
            <CheckCircle className="w-10 h-10 text-accent" />
          </motion.div>
          
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Email Verified Successfully!
            </h1>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Your account is now active. You can sign in and start creating beautiful photo albums.
            </p>
          </div>

          <Button asChild variant="accent" size="lg">
            <Link to="/login">
              Sign In
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </main>
  );
};

export default VerifiedSuccessPage;
