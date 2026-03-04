import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(process.cwd());
const outputDir = resolve(projectRoot, ".pages-site");
const demosDir = resolve(projectRoot, "demos");
const distDir = resolve(projectRoot, "dist");
const cssFile = resolve(projectRoot, "index.css");

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

if (existsSync(demosDir)) {
  cpSync(demosDir, resolve(outputDir, "demos"), { recursive: true });
}

if (existsSync(distDir)) {
  cpSync(distDir, resolve(outputDir, "dist"), { recursive: true });
}

if (existsSync(cssFile)) {
  cpSync(cssFile, resolve(outputDir, "index.css"));
}

writeFileSync(
  resolve(outputDir, "index.html"),
  [
    "<!doctype html>",
    '<html lang="fr">',
    "  <head>",
    '    <meta charset="UTF-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    "    <title>xpressui demos</title>",
    "    <style>",
    "      :root {",
    "        color-scheme: light;",
    "        --bg: #f5f1e8;",
    "        --card: #fffdf7;",
    "        --ink: #1f2937;",
    "        --muted: #6b7280;",
    "        --line: #d6d3d1;",
    "        --accent: #0f766e;",
    "      }",
    "      * { box-sizing: border-box; }",
    "      body {",
    "        margin: 0;",
    "        font-family: Georgia, 'Times New Roman', serif;",
    "        background: radial-gradient(circle at top left, rgba(15, 118, 110, 0.12), transparent 36%), linear-gradient(180deg, #faf7f0 0%, var(--bg) 100%);",
    "        color: var(--ink);",
    "      }",
    "      main { max-width: 960px; margin: 0 auto; padding: 48px 20px 72px; }",
    "      h1 { margin: 0 0 12px; font-size: clamp(2rem, 4vw, 3.4rem); line-height: 1; }",
    "      p.lead { margin: 0 0 28px; max-width: 720px; color: var(--muted); font-size: 1.05rem; }",
    "      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 18px; }",
    "      .card {",
    "        display: block;",
    "        text-decoration: none;",
    "        color: inherit;",
    "        background: var(--card);",
    "        border: 1px solid var(--line);",
    "        border-radius: 18px;",
    "        padding: 18px;",
    "        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);",
    "      }",
    "      .card:hover { border-color: var(--accent); transform: translateY(-1px); }",
    "      .card h2 { margin: 0 0 8px; font-size: 1.2rem; }",
    "      .card p { margin: 0; color: var(--muted); line-height: 1.45; }",
    "      .sub { margin-top: 24px; color: var(--muted); }",
    "      code {",
    "        display: inline-block;",
    "        margin-top: 12px;",
    "        padding: 10px 12px;",
    "        border-radius: 10px;",
    "        background: #111827;",
    "        color: #f9fafb;",
    "        font-size: 0.9rem;",
    "      }",
    "    </style>",
    "  </head>",
    "  <body>",
    "    <main>",
    "      <h1>xpressui demo gallery</h1>",
    "      <p class=\"lead\">",
    "        Landing page GitHub Pages pour accéder rapidement aux démos statiques du produit.",
    "        Les pages détaillées restent aussi disponibles dans <code>./demos/</code>.",
    "      </p>",
    "      <div class=\"grid\">",
    "        <a class=\"card\" href=\"./demos/booking-wizard.html\">",
    "          <h2>Booking Wizard</h2>",
    "          <p>Wizard multi-step avec progression, review step et transitions.</p>",
    "        </a>",
    "        <a class=\"card\" href=\"./demos/approval-workflow.html\">",
    "          <h2>Approval Workflow</h2>",
    "          <p>Flux d’approbation avec état métier et panneau de debug.</p>",
    "        </a>",
    "        <a class=\"card\" href=\"./demos/file-uploads.html\">",
    "          <h2>File Uploads</h2>",
    "          <p>Uploads multiples, drag-and-drop, validations et état d’upload.</p>",
    "        </a>",
    "        <a class=\"card\" href=\"./demos/identity-check.html\">",
    "          <h2>Identity Check</h2>",
    "          <p>Scan de document, extraction OCR/MRZ et payload KYC normalisé.</p>",
    "        </a>",
    "      </div>",
    "      <p class=\"sub\">",
    "        Index des démos: <a href=\"./demos/index.html\">./demos/index.html</a>",
    "      </p>",
    "    </main>",
    "  </body>",
    "</html>",
    "",
  ].join("\n"),
  "utf8",
);

console.log("Prepared GitHub Pages site in .pages-site");
