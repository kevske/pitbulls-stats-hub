import { useState } from "react";
import Layout from "@/components/Layout";
import PasswordProtection from "@/components/PasswordProtection";
import { useStats } from "@/contexts/StatsContext";

// Helper function to convert YouTube URL to embed format
const getEmbedUrl = (url: string): string => {
  if (!url) return '';

  // If already an embed URL, return as is
  if (url.includes('/embed/')) {
    return url;
  }

  // Extract video ID from various YouTube URL formats
  const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?/]+)/);
  if (videoIdMatch) {
    return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
  }

  // Extract playlist ID
  const playlistMatch = url.match(/[?&]list=([^&]+)/);
  if (playlistMatch) {
    return `https://www.youtube.com/embed/videoseries?list=${playlistMatch[1]}`;
  }

  // If it's just a video/playlist ID, create embed URL
  if (!url.includes('http')) {
    if (url.startsWith('PL')) {
      return `https://www.youtube.com/embed/videoseries?list=${url}`;
    }
    return `https://www.youtube.com/embed/${url}`;
  }

  return url;
};

const Videos = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const { games, loading } = useStats();

  if (!hasAccess) {
    return (
      <Layout>
        <div className="container mx-auto max-w-4xl">
          <PasswordProtection
            onSuccess={() => setHasAccess(true)}
            correctPassword={import.meta.env.VITE_ADMIN_PASSWORD}
          />
        </div>
      </Layout>
    );
  }

  // Filter games that have YouTube links and sort by game number (descending)
  const gamesWithVideos = games
    .filter(game => game.youtubeLink && game.youtubeLink.trim() !== '')
    .sort((a, b) => b.gameNumber - a.gameNumber);

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl p-4">
        <h1 className="text-4xl font-bold text-primary mb-2">Letzte Spiele</h1>
        <div className="w-20 h-1 bg-primary mb-8"></div>

        {loading ? (
          <div className="text-center py-8">Lade Videos...</div>
        ) : gamesWithVideos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Keine Videos verfügbar.
          </div>
        ) : (
          <div className="space-y-12">
            {gamesWithVideos.map((game) => (
              <div key={game.gameNumber}>
                <h2 className="text-2xl font-semibold mb-4">
                  Spieltag {game.gameNumber}: {game.homeTeam} vs {game.awayTeam}
                </h2>
                <div className="aspect-video w-full bg-secondary rounded-lg overflow-hidden shadow-lg">
                  <iframe
                    className="w-full h-full"
                    src={getEmbedUrl(game.youtubeLink!)}
                    title={`Spieltag ${game.gameNumber}: ${game.homeTeam} vs ${game.awayTeam}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Videos;
