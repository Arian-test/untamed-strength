// Tiny static server for the exported `out/` dir (local preview of the
// GitHub Pages build). No dependencies. Usage: node scripts/serve-out.mjs
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "out");
const port = Number(process.env.PORT) || 3000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

async function resolve(pathname) {
  // try as-is, as dir/index.html, and as .html
  const candidates = [];
  const clean = decodeURIComponent(pathname.split("?")[0]);
  if (clean.endsWith("/")) candidates.push(join(root, clean, "index.html"));
  else {
    candidates.push(join(root, clean));
    candidates.push(join(root, clean + ".html"));
    candidates.push(join(root, clean, "index.html"));
  }
  for (const c of candidates) {
    try {
      const s = await stat(c);
      if (s.isFile()) return c;
    } catch {}
  }
  return null;
}

createServer(async (req, res) => {
  let file = await resolve(req.url || "/");
  if (!file) file = join(root, "index.html"); // SPA-ish fallback
  try {
    const body = await readFile(file);
    res.setHeader("Content-Type", TYPES[extname(file)] || "application/octet-stream");
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
}).listen(port, () => console.log(`serving out/ on http://localhost:${port}`));
