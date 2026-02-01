import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Image, 
  Users, 
  Calendar,
  Eye,
  Copy,
  Lock,
  LockOpen,
  Building2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AlbumWithStats } from "@/hooks/useAlbums";

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

interface AlbumCardProps {
  album: AlbumWithStats;
}

export function AlbumCard({ album }: AlbumCardProps) {
  const { toast } = useToast();

  const copyUploadLink = () => {
    const link = `${window.location.origin}/submit/${album.id}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Public upload link copied to clipboard.",
    });
  };

  const isDeadlinePassed = album.submission_deadline 
    ? new Date(album.submission_deadline) < new Date()
    : false;

  const getStatusBadge = () => {
    if (album.is_locked) {
      return (
        <Badge variant="secondary" className="bg-muted text-muted-foreground">
          <Lock className="w-3 h-3 mr-1" />
          Locked
        </Badge>
      );
    }
    if (isDeadlinePassed) {
      return (
        <Badge variant="secondary" className="bg-destructive/10 text-destructive">
          Deadline Passed
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-success/10 text-success">
        <LockOpen className="w-3 h-3 mr-1" />
        Open
      </Badge>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-gradient rounded-xl p-5 shadow-card border border-border/50"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate pr-2">
            {album.title}
          </h3>
          {album.institution_name && (
            <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
              <Building2 className="w-3.5 h-3.5" />
              <span className="truncate">{album.institution_name}</span>
            </div>
          )}
        </div>
        {getStatusBadge()}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Badge variant="outline" className="text-xs">
          {albumTypeLabels[album.album_type] || album.album_type}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {paymentModeLabels[album.payment_mode] || album.payment_mode}
        </Badge>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Image className="w-4 h-4" />
          <span>{album.submission_count} submissions</span>
        </div>
        {album.submission_deadline && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{new Date(album.submission_deadline).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link to={`/album/${album.id}`}>
            <Eye className="w-4 h-4 mr-1.5" />
            Manage
          </Link>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="px-2.5"
          onClick={copyUploadLink}
          disabled={album.is_locked}
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
