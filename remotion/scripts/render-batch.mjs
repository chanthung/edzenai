import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse args: list of "compositionId:outputPath" pairs
const pairs = process.argv.slice(2).map(arg => {
  const [id, out] = arg.split(":");
  return { id, out };
});

if (pairs.length === 0) {
  console.error("Usage: node render-batch.mjs id1:/path/out1.mp4 id2:/path/out2.mp4 ...");
  process.exit(1);
}

console.log(`Bundling...`);
const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (config) => config,
});

console.log("Opening browser...");
const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: {
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  },
  chromeMode: "chrome-for-testing",
});

for (const { id, out } of pairs) {
  console.log(`Rendering ${id} → ${out}...`);
  const composition = await selectComposition({
    serveUrl: bundled,
    id,
    puppeteerInstance: browser,
  });
  console.log(`  ${composition.durationInFrames} frames`);
  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    outputLocation: out,
    puppeteerInstance: browser,
    muted: true,
    concurrency: 1,
  });
  console.log(`  ✓ Done: ${out}`);
}

await browser.close({ silent: false });
console.log("All renders complete!");
