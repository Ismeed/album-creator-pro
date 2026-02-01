import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Image, 
  Users, 
  MoreVertical, 
  Calendar,
  Eye,
  Copy,
  LogOut,
  Menu,
  X
} from "lucide-react";

// Mock data for albums
const mockAlbums = [
  {
    id: "1",
    title: "Class of 2025 - Computer Science",
    participantCount: 45,
    submissionCount: 38,
    createdAt: "2025-01-15",
    status: "active" as const,
  },
  {
    id: "2",
    title: "Bootcamp Cohort #12",
    participantCount: 24,
    submissionCount: 24,
    createdAt: "2025-01-10",
    status: "complete" as const,
  },
];

type AlbumStatus = "active" | "complete" | "draft";

interface Album {
  id: string;
  title: string;
  participantCount: number;
  submissionCount: number;
  createdAt: string;
  status: AlbumStatus;
}

const AlbumCard = ({ album }: { album: Album }) => {
  const statusColors = {
    active: "bg-success/10 text-success",
    complete: "bg-accent/10 text-accent",
    draft: "bg-muted text-muted-foreground",
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
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(album.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[album.status]}`}>
          {album.status}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{album.participantCount} expected</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Image className="w-4 h-4" />
          <span>{album.submissionCount} submitted</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link to={`/album/${album.id}`}>
            <Eye className="w-4 h-4 mr-1.5" />
            View
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="px-2.5">
          <Copy className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" className="px-2.5">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

const EmptyState = () => (
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

const DashboardPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const albums = mockAlbums;

  return (
    <main className="min-h-[100dvh] bg-background safe-top safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="mobile-container flex items-center justify-between h-16">
          <span className="text-accent font-bold text-xl">OLEX</span>
          
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-border bg-background"
            >
              <div className="mobile-container py-4 space-y-2">
                <Link
                  to="/"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Content */}
      <div className="mobile-container py-6">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Your Albums
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage and track your photo album collections
          </p>
        </motion.div>

        {/* Create button */}
        {albums.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Button asChild variant="accent" size="lg" className="w-full">
              <Link to="/album/new">
                <Plus className="w-5 h-5 mr-2" />
                Create New Album
              </Link>
            </Button>
          </motion.div>
        )}

        {/* Albums list */}
        {albums.length > 0 ? (
          <div className="space-y-4">
            {albums.map((album, index) => (
              <motion.div
                key={album.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <AlbumCard album={album} />
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </main>
  );
};

export default DashboardPage;
