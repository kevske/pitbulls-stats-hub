import { describe, it, expect } from 'vitest';
import { extractVideoId, getEmbedUrl } from './videoUtils';

describe('videoUtils', () => {
  describe('extractVideoId', () => {
    it('should extract valid video IDs from standard URLs', () => {
      expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({ videoId: 'dQw4w9WgXcQ', playlistId: null });
      expect(extractVideoId('http://youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({ videoId: 'dQw4w9WgXcQ', playlistId: null });
      expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toEqual({ videoId: 'dQw4w9WgXcQ', playlistId: null });
      expect(extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toEqual({ videoId: 'dQw4w9WgXcQ', playlistId: null });
      expect(extractVideoId('youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({ videoId: 'dQw4w9WgXcQ', playlistId: null });
    });

    it('should extract valid playlist IDs from URLs', () => {
      expect(extractVideoId('https://www.youtube.com/playlist?list=PL_test123-Playlist_')).toEqual({ videoId: null, playlistId: 'PL_test123-Playlist_' });
      expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL_test123-Playlist_')).toEqual({ videoId: 'dQw4w9WgXcQ', playlistId: 'PL_test123-Playlist_' });
    });

    it('should extract direct valid video IDs', () => {
      expect(extractVideoId('dQw4w9WgXcQ')).toEqual({ videoId: 'dQw4w9WgXcQ', playlistId: null });
    });

    it('should extract direct valid playlist IDs', () => {
      expect(extractVideoId('PL_test123-Playlist_')).toEqual({ videoId: null, playlistId: 'PL_test123-Playlist_' });
    });

    it('should return null for malicious inputs (XSS prevention)', () => {
      expect(extractVideoId('javascript:alert(1)')).toEqual({ videoId: null, playlistId: null });
      expect(extractVideoId('<script>alert("xss")</script>')).toEqual({ videoId: null, playlistId: null });
    });

    it('should return null for invalid inputs', () => {
      expect(extractVideoId('')).toEqual({ videoId: null, playlistId: null });
      expect(extractVideoId('   ')).toEqual({ videoId: null, playlistId: null });
      expect(extractVideoId('invalid_id_length')).toEqual({ videoId: null, playlistId: null });
      expect(extractVideoId('not_a_PL_prefix_playlist')).toEqual({ videoId: null, playlistId: null });
    });
  });

  describe('getEmbedUrl', () => {
    it('should return empty string for invalid inputs', () => {
      expect(getEmbedUrl('')).toBe('');
      expect(getEmbedUrl('javascript:alert(1)')).toBe('');
    });

    it('should generate embed URLs for video IDs', () => {
      expect(getEmbedUrl('dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
      expect(getEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should generate embed URLs for playlist IDs', () => {
      expect(getEmbedUrl('PL_test123')).toBe('https://www.youtube.com/embed/videoseries?list=PL_test123');
      expect(getEmbedUrl('https://www.youtube.com/playlist?list=PL_test123')).toBe('https://www.youtube.com/embed/videoseries?list=PL_test123');
    });

    it('should generate embed URLs with both video and playlist', () => {
      expect(getEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL_test123')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?list=PL_test123');
    });
  });
});
