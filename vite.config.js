import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves this project from https://sharma11ji.github.io/SAB-TOOLS/.
// Keeping the repository name here makes Vite emit asset URLs beneath that path.
export default defineConfig({
  base: "/SAB-TOOLS/",
  plugins: [react()],
});
