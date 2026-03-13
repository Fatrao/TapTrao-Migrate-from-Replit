import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve SEO files with explicit content types so the SPA fallback never intercepts them
  const seoFiles: Record<string, string> = {
    "/sitemap.xml": "application/xml; charset=utf-8",
    "/robots.txt": "text/plain; charset=utf-8",
    "/llms.txt": "text/plain; charset=utf-8",
  };

  for (const [route, contentType] of Object.entries(seoFiles)) {
    app.get(route, (_req, res) => {
      const filePath = path.resolve(distPath, route.slice(1));
      if (fs.existsSync(filePath)) {
        res.setHeader("Content-Type", contentType);
        res.sendFile(filePath);
      } else {
        res.status(404).send("Not found");
      }
    });
  }

  app.use(express.static(distPath, { redirect: false }));

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
