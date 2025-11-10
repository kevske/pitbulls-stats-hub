// Application configuration
// Note: In a real production environment, use environment variables instead of hardcoded values

export const config = {
  // Authentication
  auth: {
    // In a real application, use environment variables for sensitive data
    // This is just for demonstration purposes
    adminPassword: process.env.REACT_APP_ADMIN_PASSWORD || 'admin123',
  },
  
  // Other configuration can be added here
} as const;

// This allows TypeScript to infer the type of the config object
export type Config = typeof config;
