// Application configuration
// Note: In a real production environment, use environment variables instead of hardcoded values

export const config = {
  // Data Sources
  data: {
    // csvUrls removed as we now use Supabase
    // cacheDuration: 60 * 60 * 1000, // 1 hour (unused)
  },

  // Other configuration can be added here
} as const;

// This allows TypeScript to infer the type of the config object
export type Config = typeof config;
