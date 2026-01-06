import fs from "node:fs";
import path from "node:path";
import axios from "axios";
import * as cheerio from "cheerio";
import xlsx from "xlsx";

// One-off helper script to build an Excel file with phones sold in Paraguay
// based on the public catalog from Tienda Movil.
//
// It DOES NOT touch your existing data/products.xlsx.
// Instead it creates: data/products-paraguay.xlsx
// with the SAME column structure as your existing file, so you can
// copy/merge/rename it and then run your existing sync:products script.
//
// It also downloads product images to:
//   public/images/phones-paraguay
// and sets the Excel `images` column to the local path
//   /images/phones-paraguay/<filename>
// so your frontend can use them directly.
//
// Usage (from project root):
//   1) Install deps once (you can remove them later if you want):
//        npm install axios cheerio
//   2) Run the script:
//        node scripts/build-paraguay-products.mjs
//   3) Open data/products-paraguay.xlsx in Excel and adjust anything you like.
//   4) (Optional) Replace data/products.xlsx with the new file and run:
//        npm run sync:products
//   5) Delete this script if you no longer need it.

const TIENDAMOVIL_URL =
  "https://tiendamovil.com.py/shop/celulares/?order=product.date_add.desc&resultsPerPage=9999999";

const OUTPUT_PATH = path.resolve("data", "products-paraguay.xlsx");
const IMAGES_DIR = path.resolve("public", "images", "phones-paraguay");

// Columns must match your existing Excel structure exactly
const EXCEL_COLUMNS = [
  "id",
  "brand_id",
  "brand_name",
  "model",
  "price",
  "sale_price",
  "storage_options",
  "display_size",
  "processor",
  "ram",
  "camera",
  "battery",
  "release_year",
  "description",
  "images",
  "is_featured",
  "is_published",
];

function slugifyBrand(brand) {
  return String(brand || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "unknown";
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "item";
}

function parsePrice(text) {
  if (!text) return null;
  const cleaned = String(text)
    .replace(/[^0-9.,]/g, " ")
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!cleaned.length) return null;

  const first = cleaned[0].replace(/\./g, "").replace(/,/g, "");
  const num = Number(first);
  return Number.isNaN(num) ? null : num;
}

function extractStorageOptions(text) {
  if (!text) return [];
  const storages = new Set();
  const source = String(text);
  const regex = /(\d+)\s*GB/gi;
  let match;
  while ((match = regex.exec(source))) {
    storages.add(`${match[1]}GB`);
  }
  return Array.from(storages);
}

function extractDisplaySize(text) {
  if (!text) return "";
  const source = String(text).replace(/,/g, ".");
  const match = source.match(/(\d{1,2}(?:\.\d)?)\s*"/);
  return match ? `${match[1]}"` : "";
}

function extractBattery(text) {
  if (!text) return "";
  const match = String(text).match(/(\d{3,5})\s*mAh/i);
  return match ? `${match[1]} mAh` : "";
}

function extractRam(text) {
  if (!text) return "";
  const match = String(text).match(/(\d+)\s*GB\s*(?:RAM)?/i);
  return match ? `${match[1]}GB` : "";
}

function extractCamera(text) {
  if (!text) return "";
  const src = String(text).toLowerCase();
  const idx = src.indexOf("camara");
  if (idx === -1) return "";
  const tail = src.slice(idx);
  const end = tail.search(/[.!\n]/);
  return end === -1 ? tail.trim() : tail.slice(0, end + 1).trim();
}

function guessBrandFromTitle(title) {
  const knownBrands = [
    "Apple",
    "iPhone",
    "Samsung",
    "Xiaomi",
    "Motorola",
    "Oppo",
    "OPPO",
    "Honor",
    "HONOR",
    "Tecno",
    "TECNO",
    "ZTE",
    "Infinix",
  ];

  const t = String(title).toLowerCase();
  for (const b of knownBrands) {
    if (t.includes(b.toLowerCase())) return b.replace(/^(iphone)$/i, "Apple");
  }
  return "Sin marca";
}

function cleanText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTiendaMovilHtml(html) {
  const $ = cheerio.load(html);
  const products = [];

  $("article.product-miniature, li.product").each((_, el) => {
    const $el = $(el);

    const title = cleanText(
      $el.find("h2.h3 a, h2.product-title a, h3 a, h2 a").first().text()
    );
    if (!title) return;

    const brandText = cleanText(
      $el
        .find(".product-brand, .product-cat, .manufacturer, .product-manufacturer")
        .first()
        .text()
    );

    const brand = brandText || guessBrandFromTitle(title);

    const priceText = cleanText(
      $el
        .find(
          ".product-price-and-shipping .price, .price .amount, .woocommerce-Price-amount, .product-price"
        )
        .first()
        .text()
    );
    const price = parsePrice(priceText) ?? 0;

    const url =
      $el
        .find("a.product-thumbnail, a.thumbnail, a.product-img-link, h2 a, h3 a")
        .first()
        .attr("href") || "";

    const image =
      $el.find("img").first().attr("data-src") ||
      $el.find("img").first().attr("src") ||
      "";

    const descText = cleanText(
      $el
        .find(
          ".product-description, .product-short-description, .product-desc, .product-description-short"
        )
        .first()
        .text()
    );

    const combinedText = `${title}. ${descText}`;

    const storageOptions = extractStorageOptions(combinedText);
    const displaySize = extractDisplaySize(combinedText);
    const battery = extractBattery(combinedText);
    const ram = extractRam(combinedText);
    const camera = extractCamera(combinedText);

    products.push({
      source: "tiendamovil",
      title,
      brand,
      price,
      url,
      image,
      description: descText,
      storageOptions,
      displaySize,
      battery,
      ram,
      camera,
    });
  });

  return products;
}

function dedupeProducts(products) {
  const map = new Map();

  for (const p of products) {
    const key = `${slugifyBrand(p.brand)}|${p.title}`.toLowerCase();
    if (!map.has(key)) {
      map.set(key, p);
    }
  }

  return Array.from(map.values());
}

function toExcelRows(products) {
  return products.map((p, index) => {
    const brandId = slugifyBrand(p.brand);

    return {
      id: String(index + 1),
      brand_id: brandId,
      brand_name: p.brand || "Sin marca",
      model: p.title.replace(/^Celular\s+/i, ""),
      price: p.price || 0,
      sale_price: "",
      storage_options: p.storageOptions.join(","),
      display_size: p.displaySize,
      processor: "",
      ram: p.ram,
      camera: p.camera,
      battery: p.battery,
      release_year: "",
      description: p.description,
      images: p.image ? p.image : "",
      is_featured: false,
      is_published: true,
    };
  });
}

async function downloadImage(url, destPath) {
  const res = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
  fs.writeFileSync(destPath, res.data);
}

async function main() {
  console.log("Fetching Tienda Movil catalog from:");
  console.log("  ", TIENDAMOVIL_URL);

  const response = await axios.get(TIENDAMOVIL_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    timeout: 20000,
  });

  const rawProducts = parseTiendaMovilHtml(response.data);
  const products = dedupeProducts(rawProducts);

  console.log(`Parsed ${rawProducts.length} raw items, ${products.length} unique phones.`);

  const rows = toExcelRows(products);

  const outDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  // Download images and rewrite the `images` field to local paths
  for (const row of rows) {
    const imageUrl = String(row.images || "").trim();
    if (!imageUrl) continue;

    const baseSlug = slugify(`${row.brand_name || ""}-${row.model || row.id || ""}`);
    const urlWithoutQuery = imageUrl.split("?")[0];
    const ext = path.extname(urlWithoutQuery) || ".jpg";
    const filename = `${baseSlug}${ext}`;
    const localPath = path.join(IMAGES_DIR, filename);

    try {
      console.log("Downloading image", imageUrl, "->", localPath);
      await downloadImage(imageUrl, localPath);
      row.images = `/images/phones-paraguay/${filename}`;
    } catch (err) {
      console.warn("Failed to download image", imageUrl, "-", err.message);
    }
  }

  const worksheetData = rows.map((row) => {
    const ordered = {};
    for (const col of EXCEL_COLUMNS) {
      ordered[col] = col in row ? row[col] : "";
    }
    return ordered;
  });

  const workbook = xlsx.utils.book_new();
  const sheet = xlsx.utils.json_to_sheet(worksheetData, { header: EXCEL_COLUMNS });
  xlsx.utils.book_append_sheet(workbook, sheet, "Paraguay");

  xlsx.writeFile(workbook, OUTPUT_PATH);

  console.log(`Wrote ${rows.length} rows to ${OUTPUT_PATH}`);
  console.log("Images saved under public/images/phones-paraguay and referenced via /images/phones-paraguay/<filename>.");
}

main().catch((err) => {
  console.error("Failed to build Paraguay products Excel:", err);
  process.exit(1);
});
