import fs from "node:fs/promises";
import path from "node:path";

// One-off helper script to rename the Paraguay phone images to
// clean, consistent filenames and update the JSON to match.
//
// It reads public/data/products.json, computes a nicer filename
// from brand + model, renames the files in public/images/phones-paraguay,
// and then writes the updated JSON to both:
//   - public/data/products.json
//   - docs/data/products.json
//
// Usage (from project root):
//   node scripts/rename-paraguay-images.mjs
//
// After running, you can delete this script.

const PUBLIC_JSON_PATH = path.resolve("public", "data", "products.json");
const DOCS_JSON_PATH = path.resolve("docs", "data", "products.json");
const IMAGES_DIR = path.resolve("public", "images", "phones-paraguay");

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "item";
}

function buildNiceFilename(product) {
  const brandName = (product.brand?.name || product.brand_id || "").trim();
  let model = String(product.model || "").trim();

  // If model already starts with the brand name (e.g. "Apple iPhone 17 ..."),
  // avoid repeating it in the slug.
  if (
    brandName &&
    model.toLowerCase().startsWith(brandName.toLowerCase())
  ) {
    model = model.slice(brandName.length).trim();
  }

  const base = `${brandName} ${model}`.trim() || model || brandName || product.id;
  return slugify(base);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log("Reading", PUBLIC_JSON_PATH);
  const raw = await fs.readFile(PUBLIC_JSON_PATH, "utf8");
  /** @type {any[]} */
  const products = JSON.parse(raw);

  const renamed = [];

  for (const product of products) {
    if (!product.images || !product.images.length) continue;

    const oldPath = String(product.images[0] || "").trim();
    if (!oldPath || !oldPath.startsWith("/images/phones-paraguay/")) continue;

    const oldName = oldPath.replace("/images/phones-paraguay/", "");
    const absOld = path.join(IMAGES_DIR, oldName);

    if (!(await fileExists(absOld))) {
      console.warn("Image file not found, skipping:", absOld);
      continue;
    }

    const niceBase = buildNiceFilename(product);
    const ext = path.extname(oldName) || ".jpg";
    let newName = `${niceBase}${ext}`;
    let absNew = path.join(IMAGES_DIR, newName);

    // Avoid accidental overwrite if a file with the target name already exists
    // but belongs to a different product.
    let counter = 1;
    while (
      newName !== oldName &&
      (await fileExists(absNew)) &&
      absNew.toLowerCase() !== absOld.toLowerCase()
    ) {
      newName = `${niceBase}-${counter++}${ext}`;
      absNew = path.join(IMAGES_DIR, newName);
    }

    if (newName === oldName) {
      // Already in the desired format.
      continue;
    }

    console.log("Renaming", oldName, "->", newName);
    await fs.rename(absOld, absNew);

    const newPublicPath = `/images/phones-paraguay/${newName}`;
    product.images[0] = newPublicPath;
    renamed.push({ id: product.id, old: oldName, next: newName });
  }

  console.log(`Renamed ${renamed.length} images. Writing updated JSON...`);

  const jsonOut = JSON.stringify(products, null, 2);

  await fs.mkdir(path.dirname(PUBLIC_JSON_PATH), { recursive: true });
  await fs.writeFile(PUBLIC_JSON_PATH, jsonOut, "utf8");
  console.log("Updated", PUBLIC_JSON_PATH);

  await fs.mkdir(path.dirname(DOCS_JSON_PATH), { recursive: true });
  await fs.writeFile(DOCS_JSON_PATH, jsonOut, "utf8");
  console.log("Updated", DOCS_JSON_PATH);

  console.log("Done.");
}

main().catch((err) => {
  console.error("Failed to rename images:", err);
  process.exit(1);
});
