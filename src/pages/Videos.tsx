import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import PasswordProtection from "@/components/PasswordProtection";
import { useStats } from "@/contexts/StatsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Plus, Loader2, Tag } from "lucide-react";
import { VideoPlayerWithLogs } from "@/components/video/VideoPlayerWithLogs";
import { VideoProjectService } from '@/services/videoProjectService';
import { toast } from "sonner";

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

// Helper to extract ID from link
const extractVideoId = (url: string): { videoId: string | null, playlistId: string | null } => {
  let videoId = null;
  let playlistId = null;

  // Check playlist first
  const playlistMatch = url.match(/[?&]list=([^&]+)/);
  if (playlistMatch || url.startsWith('PL')) {
    playlistId = playlistMatch ? playlistMatch[1] : (url.startsWith('PL') ? url : null);
    return { videoId, playlistId };
  }

  // Check unique video ID
  const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?/]+)/);
  if (videoIdMatch) {
    videoId = videoIdMatch[1];
  } else if (!url.includes('http') && !url.includes('/')) {
    // assume input is ID if not URL
    videoId = url;
  }

  return { videoId, playlistId };
}

const Videos = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const { games, loading, refresh } = useStats();

  // State for adding video
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [videoLink, setVideoLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filter games that have YouTube links and sort by game number (descending)
  const gamesWithVideos = useMemo(() => games
    .filter(game => (game.youtubeLink && game.youtubeLink.trim() !== '') || (game.youtubeLinks && game.youtubeLinks.length > 0))
    .sort((a, b) => b.gameNumber - a.gameNumber), [games]);

  // Filter games that DON'T have video and sort descending
  const gamesWithoutVideos = useMemo(() => games
    .filter(game => (!game.youtubeLink || game.youtubeLink.trim() === '') && (!game.youtubeLinks || game.youtubeLinks.length === 0))
    .sort((a, b) => b.gameNumber - a.gameNumber), [games]);

  if (!hasAccess) {
    return (
      <Layout>
        <div className="container mx-auto max-w-4xl">
          <PasswordProtection
            onSuccess={(password) => {
              setAdminPassword(password || '');
              setHasAccess(true);
            }}
          // No correctPassword prop - validation happens via Edge Function
          />
        </div>
      </Layout>
    );
  }

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGame || !videoLink) return;

    setSubmitting(true);
    try {
      const { videoId, playlistId } = extractVideoId(videoLink);

      if (!videoId && !playlistId) {
        toast.error("Ungültiger YouTube Link");
        setSubmitting(false);
        return;
      }

      await VideoProjectService.addVideoToGame(
        parseInt(selectedGame),
        videoId || '',
        playlistId || undefined,
        adminPassword
      );

      toast.success("Video erfolgreich hinzugefügt!");
      setVideoLink("");
      setSelectedGame("");
      await refresh(); // Reload data to show new video

    } catch (error) {
      console.error(error);
      toast.error("Fehler beim Hinzufügen des Videos");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-[98vw] px-2 py-4">
        <div className="mb-6">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Letzte Spiele</h1>
            <div className="w-20 h-1 bg-primary"></div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Lade Videos...</div>
        ) : gamesWithVideos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Keine Videos verfügbar.
          </div>
        ) : (
          <div className="space-y-12 mb-16">
            {gamesWithVideos.map((game) => {
              // Get video data for this game (now single video per game)
              const videoData = game.videoData?.[0]; // Get first (and only) video

              if (!videoData) return null; // Skip if no video data

              return (
                <div key={game.gameNumber}>
                  <h2 className="text-2xl font-semibold mb-4">
                    Spieltag {game.gameNumber}: {game.homeTeam} vs {game.awayTeam}
                  </h2>

                  {/* Video player with event tags */}
                  <VideoPlayerWithLogs
                    gameNumber={game.gameNumber}
                    youtubeLink={videoData.link}
                  />

                  {/* Video Tagger Button */}
                  <div className="mt-4">
                    <Link
                      to={`/video-editor?game=${game.gameNumber}&video=${getEmbedUrl(videoData.link)}`}
                      state={{ adminPassword }}
                    >
                      <Button className="gap-2">
                        <Tag className="w-4 h-4" />
                        Im Video Tagger öffnen
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Video Section */}
        <div className="mt-16 pt-8 border-t border-border">
          <h2 className="text-2xl font-bold mb-6">Neues Video hinzufügen</h2>
          <div className="bg-card rounded-lg border border-border p-6 max-w-md">
            <form onSubmit={handleAddVideo} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gameSelect">Spiel auswählen</Label>
                <Select value={selectedGame} onValueChange={setSelectedGame}>
                  <SelectTrigger id="gameSelect">
                    <SelectValue placeholder="Wähle ein Spiel ohne Video" />
                  </SelectTrigger>
                  <SelectContent>
                    {gamesWithoutVideos.map(game => (
                      <SelectItem key={game.gameNumber} value={game.gameNumber.toString()}>
                        {game.homeTeam?.includes('Pitbulls') || game.homeTeam?.includes('Neuenstadt')
                          ? `Heim vs ${game.awayTeam}`
                          : `Auswärts vs ${game.homeTeam}`}
                        , {game.date}
                      </SelectItem>
                    ))}
                    {gamesWithoutVideos.length === 0 && (
                      <SelectItem value="none" disabled>Keine Spiele verfügbar</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtubeLink">YouTube Link (Video oder Playlist)</Label>
                <Input
                  id="youtubeLink"
                  value={videoLink}
                  onChange={(e) => setVideoLink(e.target.value)}
                  placeholder="https://youtu.be/..."
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting || !selectedGame || !videoLink}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird hinzugefügt...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Video hinzufügen
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Videos;
