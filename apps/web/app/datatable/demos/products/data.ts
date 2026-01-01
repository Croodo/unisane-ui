import type { Product, ProductCategory } from "./types";
import { categories, statuses, visibilities, subcategories, brands } from "./types";

const productNames: Record<ProductCategory, string[]> = {
  electronics: [
    "Wireless Earbuds Pro", "Ultra Slim Laptop 15\"", "Smart Watch Series X",
    "Noise Canceling Headphones", "4K Action Camera", "Portable Power Bank 20000mAh",
    "Bluetooth Speaker Max", "Gaming Mouse RGB", "Mechanical Keyboard", "USB-C Hub 7-in-1",
  ],
  clothing: [
    "Classic Cotton T-Shirt", "Slim Fit Jeans", "Wool Blend Blazer",
    "Running Sneakers Pro", "Leather Belt Premium", "Cashmere Sweater",
    "Waterproof Rain Jacket", "Silk Tie Collection", "Canvas Tote Bag", "Merino Wool Socks",
  ],
  home: [
    "Memory Foam Pillow", "Stainless Steel Cookware Set", "LED Floor Lamp",
    "Velvet Throw Blanket", "Wall-Mounted Shelf Unit", "Ceramic Vase Set",
    "Cotton Bed Sheet Set", "Smart Thermostat", "Air Purifier HEPA", "Robot Vacuum Cleaner",
  ],
  sports: [
    "Yoga Mat Premium", "Resistance Band Set", "Running Shoes Ultra",
    "Foam Roller Recovery", "Jump Rope Speed", "Dumbell Set Adjustable",
    "Cycling Helmet Aero", "Tennis Racket Pro", "Golf Club Set", "Swimming Goggles",
  ],
  beauty: [
    "Vitamin C Serum", "Hydrating Face Cream", "Lipstick Collection",
    "Hair Styling Wax", "Perfume Eau de Parfum", "Makeup Brush Set",
    "Nail Polish Set", "Body Lotion Shea", "Eye Cream Anti-Aging", "Facial Cleanser",
  ],
  toys: [
    "Building Blocks Set 1000pc", "Remote Control Car", "Plush Teddy Bear",
    "Science Kit Chemistry", "Outdoor Swing Set", "Puzzle 1000 Pieces",
    "Board Game Strategy", "Art Supplies Kit", "Magnetic Tiles Set", "Play Kitchen Set",
  ],
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function generateSKU(category: string, index: number): string {
  const prefix = category.substring(0, 3).toUpperCase();
  return `${prefix}-${String(index).padStart(6, "0")}`;
}

export function generateProducts(count: number): Product[] {
  const random = seededRandom(123);
  const baseDate = new Date("2025-01-01").getTime();

  return Array.from({ length: count }, (_, i) => {
    const category = categories[i % categories.length]!;
    const categoryProducts = productNames[category];
    const subcategoryList = subcategories[category];
    const subcategory = subcategoryList[i % subcategoryList.length]!;
    const brand = brands[i % brands.length]!;
    const name = categoryProducts[i % categoryProducts.length]!;

    const basePrice = Math.floor(20 + random() * 500);
    const price = Math.round(basePrice * 100) / 100;
    const hasDiscount = random() > 0.7;
    const compareAtPrice = hasDiscount ? Math.round(price * (1.1 + random() * 0.4) * 100) / 100 : null;
    const cost = Math.round(price * (0.4 + random() * 0.3) * 100) / 100;
    const quantity = Math.floor(random() * 500);
    const status = quantity === 0 ? "out_of_stock" : statuses[Math.floor(random() * (statuses.length - 1))]!;
    const visibility = visibilities[Math.floor(random() * visibilities.length)]!;
    const rating = Math.round((3 + random() * 2) * 10) / 10;
    const reviewCount = Math.floor(random() * 500);
    const weight = Math.round((0.1 + random() * 10) * 100) / 100;

    const createdAt = new Date(baseDate - Math.floor(random() * 365 * 24 * 60 * 60 * 1000))
      .toISOString()
      .split("T")[0]!;
    const updatedAt = new Date(baseDate - Math.floor(random() * 30 * 24 * 60 * 60 * 1000))
      .toISOString()
      .split("T")[0]!;

    return {
      id: `prod-${i + 1}`,
      sku: generateSKU(category, i + 1000),
      name: `${brand} ${name}`,
      description: `High quality ${name.toLowerCase()} from ${brand}. Perfect for ${subcategory.toLowerCase()} enthusiasts.`,
      category,
      subcategory,
      brand,
      price,
      compareAtPrice,
      cost,
      quantity,
      status,
      visibility,
      rating,
      reviewCount,
      imageUrl: `https://picsum.photos/seed/${i + 1}/200/200`,
      weight,
      createdAt,
      updatedAt,
    };
  });
}
