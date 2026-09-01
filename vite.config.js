import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("monaco-editor") || id.includes("@monaco-editor")) {
            return "vendor-monaco";
          }

          if (id.includes("@clerk")) {
            return "vendor-clerk";
          }

          if (id.includes("react-chartjs-2") || id.includes("chart.js")) {
            return "vendor-charts";
          }

          if (
            id.includes("react-syntax-highlighter") ||
            id.includes("prismjs")
          ) {
            return "vendor-syntax";
          }

          if (id.includes("framer-motion")) {
            return "vendor-motion";
          }

          return "vendor";
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
