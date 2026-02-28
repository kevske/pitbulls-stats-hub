
const VALID_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
const VALID_PLAYLIST_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

// Helper function to convert YouTube URL to embed format
export const getEmbedUrl = (url: string): string => {
  if (!url) return '';

  const { videoId, playlistId } = extractVideoId(url);

  if (videoId && playlistId) {
    return `https://www.youtube.com/embed/${videoId}?list=${playlistId}`;
  } else if (playlistId) {
    return `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
  } else if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  return '';
};

// Helper to extract ID from link
export const extractVideoId = (url: string): { videoId: string | null, playlistId: string | null } => {
  let videoId: string | null = null;
  let playlistId: string | null = null;

  if (!url || typeof url !== 'string') return { videoId, playlistId };

  const trimmedUrl = url.trim();

  // Extract playlist ID from URL
  const playlistMatch = trimmedUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch && VALID_PLAYLIST_ID_REGEX.test(playlistMatch[1])) {
    playlistId = playlistMatch[1];
  }

  // Direct playlist ID input
  if (!playlistId && trimmedUrl.startsWith('PL') && VALID_PLAYLIST_ID_REGEX.test(trimmedUrl)) {
    playlistId = trimmedUrl;
  }

  // Extract video ID from URL
  const videoIdMatch = trimmedUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (videoIdMatch && VALID_VIDEO_ID_REGEX.test(videoIdMatch[1])) {
    videoId = videoIdMatch[1];
  }

  // Direct video ID input
  if (!videoId && VALID_VIDEO_ID_REGEX.test(trimmedUrl)) {
    videoId = trimmedUrl;
  }

  return { videoId, playlistId };
};
