import fs from "node:fs";
import path from "node:path";
import xlsx from "xlsx";

const OUTPUT_DIR = path.resolve("data");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "products.xlsx");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createSampleProducts() {
  const brands = [
    {
      brand_id: "iphone",
      brand_name: "iPhone",
      baseModels: ["iPhone 13", "iPhone 14", "iPhone 15", "iPhone 15 Pro"],
      display: "6.1 pulgadas Super Retina XDR",
      processor: "A16 Bionic",
      ram: "6GB",
      camera: "48MP",
      battery: "3279 mAh",
      releaseYears: [2021, 2022, 2023],
    },
    {
      brand_id: "samsung",
      brand_name: "Samsung",
      baseModels: ["Galaxy S22", "Galaxy S23", "Galaxy A54", "Galaxy A34"],
      display: "6.4 pulgadas AMOLED",
      processor: "Exynos / Snapdragon",
      ram: "8GB",
      camera: "50MP",
      battery: "4500 mAh",
      releaseYears: [2021, 2022, 2023],
    },
    {
      brand_id: "xiaomi",
      brand_name: "Xiaomi",
      baseModels: ["Redmi Note 11", "Redmi Note 12", "Poco X5", "Poco F5"],
      display: "6.67 pulgadas AMOLED",
      processor: "Snapdragon",
      ram: "6GB",
      camera: "64MP",
      battery: "5000 mAh",
      releaseYears: [2020, 2021, 2022, 2023],
    },
    {
      brand_id: "motorola",
      brand_name: "Motorola",
      baseModels: ["Moto G32", "Moto G54", "Moto Edge 40", "Moto E13"],
      display: "6.5 pulgadas IPS",
      processor: "MediaTek",
      ram: "4GB",
      camera: "50MP",
      battery: "5000 mAh",
      releaseYears: [2020, 2021, 2022],
    },
  ];

  const storageOptionsList = ["64GB", "128GB", "256GB", "512GB"];
  const imagesBase = "/images/products";

  const products = [];
  let idCounter = 1;

  for (const brand of brands) {
    for (const baseModel of brand.baseModels) {
      for (const storage of storageOptionsList.slice(0, 3)) {
        if (products.length >= 100) break;

        const id = String(idCounter++);
        const model = `${baseModel} ${storage}`;
        const priceBase = 1_500_000 + Math.floor(Math.random() * 6_000_000);
        const hasSale = Math.random() < 0.35;
        const sale_price = hasSale ? priceBase - Math.floor(priceBase * (0.1 + Math.random() * 0.25)) : "";
        const year = brand.releaseYears[Math.floor(Math.random() * brand.releaseYears.length)];

        products.push({
          id,
          brand_id: brand.brand_id,
          brand_name: brand.brand_name,
          model,
          price: priceBase,
          sale_price,
          storage_options: `${storage}`,
          display_size: brand.display,
          processor: brand.processor,
          ram: brand.ram,
          camera: brand.camera,
          battery: brand.battery,
          release_year: year,
          description: `Ejemplo de ${brand.brand_name} ${model} con especificaciones típicas.`,
          images: `${imagesBase}/${brand.brand_id}-${baseModel.replace(/\s+/g, "-")}-${storage}.png`,
          is_featured: Math.random() < 0.2,
          is_published: true,
        });
      }
      if (products.length >= 100) break;
    }
    if (products.length >= 100) break;
  }

  return products;
}

function main() {
  ensureDir(OUTPUT_DIR);

  const products = createSampleProducts();

  const worksheet = xlsx.utils.json_to_sheet(products);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Products");

  xlsx.writeFile(workbook, OUTPUT_PATH);

  console.log(`Generated ${products.length} sample products at`, OUTPUT_PATH);
}

main();
