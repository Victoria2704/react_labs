import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/google-books-image": {
        target: "https://books.google.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/google-books-image/, ""),
      },
      "/open-library-cover": {
        target: "https://covers.openlibrary.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/open-library-cover/, ""),
      },
    },
  },
  preview: {
    proxy: {
      "/google-books-image": {
        target: "https://books.google.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/google-books-image/, ""),
      },
      "/open-library-cover": {
        target: "https://covers.openlibrary.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/open-library-cover/, ""),
      },
    },
  },
});
