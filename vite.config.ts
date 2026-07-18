import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8017,
    host: "::",
    allowedHosts: [".trycloudflare.com"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const moduleId = id.replace(/\\/g, "/");
          if (!moduleId.includes("/node_modules/")) return undefined;

          if (/\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(moduleId)) {
            return "react-vendor";
          }
          if (moduleId.includes("/node_modules/@supabase/")) {
            return "supabase-vendor";
          }
          if (moduleId.includes("/node_modules/@tanstack/")) {
            return "query-vendor";
          }

          return undefined;
        },
      },
    },
  },
});
