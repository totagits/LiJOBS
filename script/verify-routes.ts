import { execSync } from "child_process";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const testUrls = [
  { name: "Direct URL: National Statistics", url: "https://totagits.github.io/LiJOBS/data/national" },
  { name: "Direct URL: Job Postings", url: "https://totagits.github.io/LiJOBS/data/postings" },
  { name: "Direct URL: Job Seekers", url: "https://totagits.github.io/LiJOBS/data/seekers" },
  { name: "Direct URL: Director Dashboard", url: "https://totagits.github.io/LiJOBS/director" }
];

console.log("Starting headless Edge DOM verification for LiJOBS on GitHub Pages...\n");

for (const item of testUrls) {
  try {
    const cmd = `"${edgePath}" --headless --disable-gpu --virtual-time-budget=5000 --dump-dom "${item.url}"`;
    const dom = execSync(cmd, { encoding: "utf8", timeout: 20000 });
    const hasRootContent = dom.includes('id="root"') && !dom.includes('<div id="root"></div>');
    const hasError = dom.includes("Something went wrong");
    
    // Check specific keywords that prove the page rendered
    let verified = false;
    let detail = "";

    if (item.name.includes("Home")) {
      verified = dom.includes("Observatory") || dom.includes("LiJOBS") || dom.includes("Total Jobs");
      detail = verified ? "Found observatory / jobs content" : "Keyword missing";
    } else if (item.name.includes("National Statistics")) {
      verified = dom.includes("National Statistics") || dom.includes("Key Employment Indicators") || dom.includes("Total Employment Spells");
      detail = verified ? "Found key indicators & stats content" : "Keyword missing";
    } else if (item.name.includes("Job Postings")) {
      verified = dom.includes("Job Postings") || dom.includes("Total Postings") || dom.includes("Agricultural Extension");
      detail = verified ? "Found postings cards & filters" : "Keyword missing";
    } else if (item.name.includes("Job Seekers")) {
      verified = dom.includes("Job Seekers") || dom.includes("Total Registered") || dom.includes("LR-SEEK");
      detail = verified ? "Found seekers cards & metrics" : "Keyword missing";
    } else if (item.name.includes("Director Dashboard")) {
      verified = dom.includes("Director") || dom.includes("County Breakdown") || dom.includes("Employment Records");
      detail = verified ? "Found director metrics & county cards" : "Keyword missing";
    }

    console.log(`[${verified ? "PASS" : "FAIL"}] ${item.name} (${item.url})`);
    console.log(`       Rendered DOM size: ${dom.length} chars | Has Error Boundary: ${hasError} | Result: ${detail}`);
  } catch (err) {
    console.error(`[ERROR] ${item.name}: ${err.message}`);
  }
}

console.log("\nVerification complete!");
