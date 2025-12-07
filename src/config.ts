// Application configuration
// Note: In a real production environment, use environment variables instead of hardcoded values

export const config = {
  // Data Sources
  data: {
    csvUrls: {
      games: 'https://docs.google.com/spreadsheets/d/1ZGAEy5VaCUuhGVPG3cB--n-2u7thwwPn-Rhsk-M-S7I/gviz/tq?tqx=out:csv&sheet=Games',
      playerGameLogs: 'https://docs.google.com/spreadsheets/d/1ZGAEy5VaCUuhGVPG3cB--n-2u7thwwPn-Rhsk-M-S7I/gviz/tq?tqx=out:csv&sheet=Spieler',
      playerTotals: 'https://docs.google.com/spreadsheets/d/1ZGAEy5VaCUuhGVPG3cB--n-2u7thwwPn-Rhsk-M-S7I/gviz/tq?tqx=out:csv&sheet=Totals',
      playerBios: 'https://docs.google.com/spreadsheets/d/1ZGAEy5VaCUuhGVPG3cB--n-2u7thwwPn-Rhsk-M-S7I/gviz/tq?tqx=out:csv&sheet=Bio'
    },
    cacheDuration: 60 * 60 * 1000, // 1 hour
  },

  // Other configuration can be added here
} as const;

// This allows TypeScript to infer the type of the config object
export type Config = typeof config;
