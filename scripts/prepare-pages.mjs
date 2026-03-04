import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(process.cwd());
const outputDir = resolve(projectRoot, ".pages-site");
const demosDir = resolve(projectRoot, "demos");
const distDir = resolve(projectRoot, "dist");

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

if (existsSync(demosDir)) {
  cpSync(demosDir, resolve(outputDir, "demos"), { recursive: true });
}

if (existsSync(distDir)) {
  cpSync(distDir, resolve(outputDir, "dist"), { recursive: true });
}

writeFileSync(
  resolve(outputDir, "index.html"),
  [
    "<!doctype html>",
    '<html lang="en">',
    "  <head>",
    '    <meta charset="UTF-8" />',
    '    <meta http-equiv="refresh" content="0; url=./demos/index.html" />',
    "    <title>xpressui demos</title>",
    "  </head>",
    "  <body>",
    '    <p>Redirecting to <a href="./demos/index.html">demos</a>...</p>',
    "  </body>",
    "</html>",
    "",
  ].join("\n"),
  "utf8",
);

console.log("Prepared GitHub Pages site in .pages-site");
