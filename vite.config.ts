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
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          // Heavy admin-only libs — must NEVER end up in the parent bundle
          if (
            id.includes("xlsx") ||
            id.includes("jspdf") ||
            id.includes("html2canvas") ||
            id.includes("@huggingface/transformers") ||
            id.includes("@googlemaps/js-api-loader")
          ) {
            return "heavy-admin";
          }

          if (id.includes("recharts") || id.includes("d3-")) {
            return "charts";
          }

          if (id.includes("@radix-ui")) {
            return "radix";
          }

          if (
            id.includes("@supabase/supabase-js") ||
            id.includes("@tanstack/react-query")
          ) {
            return "data";
          }

          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("react-router")
          ) {
            return "react-vendor";
          }
        },
      },
    },
  },
}));
