// Phone-size QA for Poirot: serves dist/, seeds the demo pantry, and
// walks the main screens taking screenshots at 390x844 @2x.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const ROOT = "/Users/family/.local/share/vellum/assistants/vellum-spry-vole-7twl1m/.vellum/workspace/poirot";
const DIST = path.join(ROOT, "dist");
const OUT = "/Users/family/.local/share/vellum/assistants/vellum-spry-vole-7twl1m/.vellum/workspace/scratch/poirot";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

fs.mkdirSync(OUT, { recursive: true });

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  let file = path.join(DIST, decodeURIComponent(url.pathname));
  if (url.pathname === "/" || !path.extname(file)) file = path.join(DIST, "index.html");
  if (!file.startsWith(DIST) || !fs.existsSync(file)) {
    res.writeHead(404);
    res.end("not found");
    return;
  }
  res.writeHead(200, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

const port = 4319;
await new Promise((r) => server.listen(port, r));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--hide-scrollbars", "--force-device-scale-factor=2"],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
});

const page = await browser.newPage();
const problems = [];
page.on("console", (m) => {
  if (m.type() === "error") problems.push(`console: ${m.text()}`);
});
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(name) {
  await wait(420);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  if (overflow > 0) problems.push(`${name}: horizontal overflow ${overflow}px`);
  console.log("shot", name);
}

async function clickText(selector, text, { exact = false } = {}) {
  const ok = await page.evaluate(
    (sel, t, ex) => {
      const els = [...document.querySelectorAll(sel)];
      const el = els.find((e) => {
        const s = (e.textContent || "").trim();
        return ex ? s === t : s.includes(t);
      });
      if (!el) return false;
      el.click();
      return true;
    },
    selector,
    text,
    exact,
  );
  if (!ok) throw new Error(`could not click "${text}" in ${selector}`);
  await wait(300);
}

async function clickLabel(label) {
  const ok = await page.evaluate((l) => {
    const el = document.querySelector(`[aria-label="${l}"]`);
    if (!el) return false;
    el.click();
    return true;
  }, label);
  if (!ok) throw new Error(`no aria-label ${label}`);
  await wait(300);
}

await page.goto(`http://localhost:${port}/`, { waitUntil: "networkidle0" });
await page.waitForSelector(".shelf-tile");
await page.evaluate(() => document.fonts.ready);
await wait(300);

await shot("01-home");

await clickText(".shelf-tile", "Fridge");
await shot("02-shelf");

await clickText(".row", "Whole milk");
await shot("03-item");

await clickLabel("Edit item");
await shot("04-editor");
await clickLabel("Close");
await wait(200);

await clickText(".tab", "Items");
await shot("05-items");

await clickText(".chip", "Due soon");
await shot("06-due");

await clickText(".tab", "Study");
await shot("07-settings");

await clickText(".setting-row", "Shelves");
await shot("08-shelves");

await clickText(".btn", "Add a shelf");
await shot("09-shelf-editor");
await clickLabel("Close");

// FAB add flow
await clickText(".tab", "Shelves");
await page.click(".fab");
await wait(300);
await page.type("#item-name", "Saffron");
await shot("10-add-item");
await clickLabel("Close");

// empty-ish state check: search for nonsense
await clickText(".tab", "Items");
await page.type(".search", "zzzz");
await shot("11-no-results");

// desktop width sanity
await page.setViewport({ width: 900, height: 900, deviceScaleFactor: 1 });
await page.goto(`http://localhost:${port}/`, { waitUntil: "networkidle0" });
await page.waitForSelector(".shelf-tile");
await shot("12-desktop");

const stats = await page.evaluate(() => ({
  shelves: document.querySelectorAll(".shelf-tile").length,
  items: document.querySelectorAll(".tile-count").length,
  fontFraunces: getComputedStyle(document.querySelector(".display")).fontFamily,
}));
console.log("stats", JSON.stringify(stats));

await browser.close();
server.close();

if (problems.length) {
  console.log("\nPROBLEMS:");
  for (const p of problems) console.log(" -", p);
  process.exitCode = 1;
} else {
  console.log("\nAll screens captured, no console errors or overflow.");
}
