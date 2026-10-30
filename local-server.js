"use strict";
/**
 * Server lokal untuk uji coba:  node dev/local-server.js  (default http://localhost:3000)
 *  - Menyajikan file statis dari root project
 *  - /api/sheet memakai data uji (dev/fixture.js) lewat jalur parser CSV yang sama
 *    dengan produksi. Jika SHEET_ID diisi, otomatis memakai Google Sheet asli.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
// Path disusun saat runtime (bukan literal) supaya bundler Vercel tidak mencoba meresolusinya.
const { parseCSV, normalizeAll, loadAll } = require(path.join(__dirname, "..", "api", "_lib", "sheet"));
const fixture = require(path.join(__dirname, "fixture"));

const ROOT = path.join(__dirname, "..");
const PORT = process.env.PORT || 3000;
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png",
};

const toCSV = (m) => m.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");

async function apiSheet() {
  if (process.env.SHEET_ID) return loadAll(process.env);
  const matrices = {};
  for (const k of Object.keys(fixture)) matrices[k] = parseCSV(toCSV(fixture[k]));
  return { ...normalizeAll(matrices), warnings: [], fetchedAt: new Date().toISOString() };
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/api/sheet") {
    try {
      if (url.searchParams.get("fail")) throw new Error('Google Sheet meminta login. Atur Share sheet ke "Anyone with the link: Viewer", lalu coba lagi.');
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      res.end(JSON.stringify(await apiSheet()));
    } catch (e) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  let p = decodeURIComponent(url.pathname);
  if (p === "/") p = "/index.html";
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT) || file.includes(`${path.sep}dev${path.sep}`) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end("Not found"); return;
  }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Dashboard lokal: http://localhost:${PORT}`));
