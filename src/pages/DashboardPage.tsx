import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AlbumCard } from "@/components/dashboard/AlbumCard";
import { EmptyAlbumsState } from "@/components/dashboard/EmptyAlbumsState";
import { EmailVerificationBanner } from "@/components/dashboard/EmailVerificationBanner";
import { useAlbums } from "@/hooks/useAlbums";
import { useOrganizerProfile } from "@/hooks/useOrganizerProfile";

const DashboardPage = () => {
  const { data: albums = [], isLoading, error } = useAlbums();
  const { data: organizer } = useOrganizerProfile();

  return (
    <main className="min-h-[100dvh] bg-background safe-top safe-bottom">
      <DashboardHeader />

      {/* Content */}
      <div className="mobile-container py-6">
        {/* Email Verification Banner */}
        {organizer && !organizer.is_verified && (
          <EmailVerificationBanner 
            email={organizer.email} 
            fullName={organizer.full_name} 
          />
        )}

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

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive mb-2">Failed to load albums</p>
            <p className="text-sm text-muted-foreground">Please try again later</p>
          </div>
        )}

        {/* Content when loaded */}
        {!isLoading && !error && (
          <>
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
              <EmptyAlbumsState />
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default DashboardPage;
