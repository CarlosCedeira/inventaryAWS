import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom", // necesario para simular el DOM
    globals: true,
    setupFiles: "./src/setupTests.js",
    deps: {
      fallbackCJS: true, // 👈 IMPORTANTE
    },
  },
});
