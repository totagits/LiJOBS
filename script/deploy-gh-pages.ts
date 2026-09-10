import { execSync } from "child_process";
import path from "path";
import fs from "fs";

async function deployGhPages() {
  console.log("Fetching GitHub authentication token...");
  const token = execSync("gh auth token").toString().trim();
  const repoUrl = `https://${token}@github.com/totagits/LiJOBS.git`;
  const distDir = path.resolve("dist/public");

  if (!fs.existsSync(distDir)) {
    throw new Error("dist/public does not exist. Run build:pages first.");
  }

  const gitDir = path.join(distDir, ".git");
  if (!fs.existsSync(gitDir)) {
    console.log("Initializing git repository in dist/public...");
    execSync("git init", { cwd: distDir, stdio: "inherit" });
  }

  console.log("Configuring git user...");
  execSync('git config user.name "totagits"', { cwd: distDir, stdio: "inherit" });
  execSync('git config user.email "bot@totagits.github.io"', { cwd: distDir, stdio: "inherit" });
  execSync("git checkout -B gh-pages", { cwd: distDir, stdio: "inherit" });
  execSync("git add -A", { cwd: distDir, stdio: "inherit" });
  
  try {
    execSync('git commit -m "Deploy LiJOBS fix for blank pages [skip ci]"', { cwd: distDir, stdio: "inherit" });
  } catch (e) {
    console.log("No new changes to commit in dist/public");
  }

  console.log("Pushing static build to gh-pages branch...");
  execSync(`git push --force "${repoUrl}" gh-pages`, { cwd: distDir, stdio: "inherit" });
  console.log("Successfully deployed to GitHub Pages!");
}

deployGhPages().catch((err) => {
  console.error("Deploy failed:", err);
  process.exit(1);
});
