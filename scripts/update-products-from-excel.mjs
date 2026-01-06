import fs from "node:fs/promises";
import path from "node:path";
import xlsx from "xlsx";

// This script reads an Excel file and regenerates public/data/products.json
// Run it from the project root with:
//   npm run sync:products
//
// Expected Excel file: data/products.xlsx
// Sheet: first sheet
// Columns (example):
//   id                  -> string (if empty, a numeric row index will be used)
//   brand_id            -> string (e.g. "iphone")
//   brand_name          -> string (e.g. "iPhone")
//   model               -> string
//   price               -> number
//   sale_price          -> number or empty
//   storage_options     -> comma-separated (e.g. "128GB,256GB")
//   display_size        -> string
//   processor           -> string
//   ram                 -> string
//   camera              -> string
//   battery             -> string
//   release_year        -> number
//   description         -> string
//   images              -> comma-separated URLs/paths (e.g. "/images/p1.png,/images/p2.png")
//   is_featured         -> TRUE/FALSE or 1/0
//   is_published        -> TRUE/FALSE or 1/0

const EXCEL_PATH = path.resolve("data", "products.xlsx");
const OUTPUT_PATH = path.resolve("public", "data", "products.json");
const DOCS_OUTPUT_PATH = path.resolve("docs", "data", "products.json");

function parseBool(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (!v) return false;
    return ["true", "1", "yes", "y", "si", "sí"].includes(v);
  }
  return false;
}

function parseNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.replace(/,/g, ""));
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

async function main() {
  console.log("Reading Excel file:", EXCEL_PATH);

  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  const products = rows.map((row, index) => {
    const id = String(row.id || index + 1);
    const brandId = String(row.brand_id || "").trim() || "unknown";
    const brandName = String(row.brand_name || "").trim() || "Sin marca";

    const price = parseNumber(row.price) ?? 0;
    const salePrice = parseNumber(row.sale_price);

    const storageOptions = String(row.storage_options || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const images = String(row.images || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const releaseYear = parseNumber(row.release_year);

    return {
      id,
      brand_id: brandId,
      model: String(row.model || "").trim(),
      price,
      sale_price: salePrice,
      storage_options: storageOptions,
      display_size: String(row.display_size || "") || null,
      processor: String(row.processor || "") || null,
      ram: String(row.ram || "") || null,
      camera: String(row.camera || "") || null,
      battery: String(row.battery || "") || null,
      release_year: releaseYear,
      description: String(row.description || "") || null,
      images,
      is_featured: parseBool(row.is_featured),
      is_published: parseBool(row.is_published ?? true),
      view_count: 0,
      click_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      brand: {
        id: brandId,
        name: brandName,
        logo_url: null,
        created_at: new Date().toISOString(),
      },
    };
  });

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(products, null, 2), "utf8");

  // Also keep the docs/ copy in sync for the static (GitHub Pages) build
  try {
    await fs.mkdir(path.dirname(DOCS_OUTPUT_PATH), { recursive: true });
    await fs.writeFile(DOCS_OUTPUT_PATH, JSON.stringify(products, null, 2), "utf8");
    console.log(`Wrote ${products.length} products to`, DOCS_OUTPUT_PATH);
  } catch (err) {
    console.warn("Failed to write docs/data/products.json:", err.message);
  }

  console.log(`Wrote ${products.length} products to`, OUTPUT_PATH);
}

main().catch((err) => {
  console.error("Failed to update products.json from Excel:", err);
  process.exit(1);
});
