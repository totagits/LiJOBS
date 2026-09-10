import { build as viteBuild } from "vite";
import { copyFile, writeFile, rm } from "fs/promises";
import path from "path";

async function buildGhPages() {
  console.log("Cleaning previous dist...");
  await rm("dist", { recursive: true, force: true });

  console.log("Building LiJOBS client for GitHub Pages (base: /LiJOBS/)...");
  process.env.VITE_BASE_PATH = "/LiJOBS/";
  process.env.VITE_STATIC_DEMO = "true";

  await viteBuild({
    base: "/LiJOBS/",
  });

  const outDir = path.resolve("dist/public");

  // Create .nojekyll to prevent GitHub Pages Jekyll processing
  console.log("Writing .nojekyll file...");
  await writeFile(path.join(outDir, ".nojekyll"), "");

  // Ensure 404.html is in outDir
  console.log("Setting up SPA 404.html fallback...");
  await copyFile(
    path.join("client/public/404.html"),
    path.join(outDir, "404.html")
  );

  console.log("GitHub Pages build completed successfully in dist/public!");
}

buildGhPages().catch((err) => {
  console.error("Error building for GitHub Pages:", err);
  process.exit(1);
});
