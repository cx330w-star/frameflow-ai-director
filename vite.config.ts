import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  base: process.env.BASE_PATH || "/",
  esbuild: { jsx: "automatic" },
  build: {
    outDir: "dist",
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        v2: fileURLToPath(new URL("./v2/index.html", import.meta.url)),
        caseStudy: fileURLToPath(new URL("./case-study/index.html", import.meta.url)),
      },
    },
  },
});
