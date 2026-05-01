import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  define: {
    "import.meta.env.VITE_BUILD_ID": JSON.stringify(
      process.env.VITE_BUILD_ID || Date.now().toString(36)
    ),
    "import.meta.env.VITE_BUILD_TIME": JSON.stringify(new Date().toISOString()),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // NOTE: manualChunks removed — splitting recharts/radix away from react-vendor
  // caused a circular-init "Cannot access 'A' before initialization" runtime error
  // in production. Let Rollup auto-split based on dynamic imports instead.
}));
