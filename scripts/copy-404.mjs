import { copyFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, "..", "dist");
const indexHtml = path.join(distDir, "index.html");
const notFoundHtml = path.join(distDir, "404.html");

await copyFile(indexHtml, notFoundHtml);
console.log("Copied dist/index.html -> dist/404.html for GitHub Pages.");