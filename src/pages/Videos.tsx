import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import PasswordProtection from "@/components/PasswordProtection";
import { useStats } from "@/contexts/StatsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Plus, Loader2, Tag, CheckCircle } from "lucide-react";
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
    // Also check for playlist ID in the same URL
    const listMatch = url.match(/[?&]list=([^&]+)/);
    if (listMatch) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}?list=${listMatch[1]}`;
    }
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

  if (!url) return { videoId, playlistId };

  // Direct playlist ID input (no URL, just the ID)
  if (url.startsWith('PL') && /^[a-zA-Z0-9_-]+$/.test(url)) {
    playlistId = url;
    return { videoId, playlistId };
  }

  // Extract video ID from URL
  const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/);
  if (videoIdMatch) {
    videoId = videoIdMatch[1];
  }

  // Extract playlist ID from URL (can coexist with video ID)
  const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch) {
    playlistId = playlistMatch[1];
  }

  // If we found either, return
  if (videoId || playlistId) {
    return { videoId, playlistId };
  }

  // Fallback: Check if input IS a valid video ID (exactly 11 chars, safe charset)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    videoId = url;
  }

  return { videoId, playlistId };
}

const Videos = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const { games, videoStats, loading, refresh } = useStats();

  // Set of game numbers that have stats pushed to Stats Hub
  const gamesWithStatsPushed = useMemo(() => {
    return new Set(videoStats.map(s => s.gameNumber));
  }, [videoStats]);

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
                  <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                    <span>Spieltag {game.gameNumber}: {game.homeTeam} vs {game.awayTeam}</span>
                    {/* Tagging Status Badge */}
                    {/* Tagging Status Badge - Aggregated from all videos */}
                    {(() => {
                      // Aggregate stats from all videos in this game
                      const allVideoData = game.videoData || [];
                      let totalTaggedPoints = 0;

                      // Check if any video has events (meaning tagging started)
                      const hasTagging = allVideoData.some(v => v.events && v.events.length > 0);

                      if (!hasTagging) return null;

                      // Calculate tagged points directly from events
                      // This ensures accuracy even if metadata is outdated or missing
                      allVideoData.forEach(v => {
                        if (v.events) {
                          v.events.forEach((e: any) => {
                            if (e.type === 'shot' && !e.missed && e.points) {
                              totalTaggedPoints += e.points;
                            }
                          });
                        }
                      });

                      // Recalculate based on game final score (most accurate)
                      // Reuse logic from taggingStatus.ts but inline here for display
                      // We need the Pitbulls score
                      const scoreParts = game.finalScore.split(/[-:]/);
                      let pitbullsScore = 0;
                      const isAway = game.awayTeam.includes('Pitbulls') || game.awayTeam.includes('Neuenstadt');

                      if (scoreParts.length >= 2) {
                        pitbullsScore = parseInt(scoreParts[isAway ? 1 : 0]) || 0;
                      } else {
                        pitbullsScore = parseInt(scoreParts[0]) || 0;
                      }

                      const percentage = pitbullsScore > 0 ? Math.round((totalTaggedPoints / pitbullsScore) * 100) : 0;

                      let status: 'excellent' | 'good' | 'poor' | 'unknown' = 'unknown';
                      if (percentage >= 90) status = 'excellent';
                      else if (percentage >= 75) status = 'good';
                      else status = 'poor';

                      return (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${status === 'excellent'
                          ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                          : status === 'good'
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'
                            : status === 'poor'
                              ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                              : 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                          }`}>
                          {percentage}% Tagged
                        </span>
                      );
                    })()}
                    {/* Stats Pushed Badge */}
                    {gamesWithStatsPushed.has(game.gameNumber) && (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Stats
                      </span>
                    )}
                  </h2>

                  {/* Video player with event tags */}
                  <VideoPlayerWithLogs
                    gameNumber={game.gameNumber}
                    youtubeLink={videoData.link}
                  />

                  {/* Video Tagger Button */}
                  <div className="mt-4">
                    <Link
                      to={`/video-editor?game=${game.gameNumber}&video=${encodeURIComponent(getEmbedUrl(videoData.link))}`}
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
