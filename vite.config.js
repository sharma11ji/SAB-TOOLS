import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves this project from https://sharma11ji.github.io/SAB-TOOLS/.
// Firebase Hosting serves from root; GitHub Pages serves from the repository subpath.
export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/SAB-TOOLS/" : "/",
  plugins: [react()],
});
