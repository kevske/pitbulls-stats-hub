
// Helper function to convert YouTube URL to embed format
export const getEmbedUrl = (url: string): string => {
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
export const extractVideoId = (url: string): { videoId: string | null, playlistId: string | null } => {
  let videoId: string | null = null;
  let playlistId: string | null = null;

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
};
