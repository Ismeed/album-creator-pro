import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Image, Plus } from "lucide-react";

export function EmptyAlbumsState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
        <Image className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No albums yet
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
        Create your first album and start collecting photos from your group.
      </p>
      <Button asChild variant="accent">
        <Link to="/album/new">
          <Plus className="w-4 h-4 mr-2" />
          Create Album
        </Link>
      </Button>
    </motion.div>
  );
}
