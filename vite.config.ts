import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: process.env.NODE_ENV === 'production' ? '/pitbulls-stats-hub/' : '/',
  // Ensure the build outputs to the correct directory for GitHub Pages
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Make environment variables available in the client
    target: 'esnext',
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // VITE_ prefixed environment variables are automatically available to the client
}));
