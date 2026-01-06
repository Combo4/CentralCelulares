import { copyFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.resolve(__dirname, "..", "docs");
const indexHtml = path.join(outDir, "index.html");
const notFoundHtml = path.join(outDir, "404.html");

await copyFile(indexHtml, notFoundHtml);
console.log("Copied docs/index.html -> docs/404.html for GitHub Pages.");
