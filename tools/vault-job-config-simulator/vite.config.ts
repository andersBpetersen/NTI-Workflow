/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/tools/vault-job-config-simulator/",
  plugins: [react()],
  test: {
    environment: "jsdom",
  },
});
