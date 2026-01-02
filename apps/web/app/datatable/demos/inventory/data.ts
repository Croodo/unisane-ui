import type { InventoryItem, InventoryCategory, UnitType, InventoryStatus } from "./types";
import { inventoryCategories, unitTypes, suppliers, warehouseLocations } from "./types";

// ─── PRODUCT NAME TEMPLATES ───────────────────────────────────────────────────

const productNamesByCategory: Record<InventoryCategory, string[]> = {
  Electronics: [
    "USB-C Charging Cable", "Wireless Mouse", "Bluetooth Headphones", "Power Bank 10000mAh",
    "LED Desk Lamp", "Webcam HD 1080p", "Keyboard Mechanical", "Monitor Stand",
    "USB Hub 4-Port", "Wireless Charger", "Laptop Sleeve 15\"", "HDMI Cable 2m",
  ],
  Groceries: [
    "Basmati Rice 5kg", "Refined Oil 1L", "Wheat Flour 10kg", "Sugar 5kg",
    "Toor Dal 1kg", "Salt 1kg", "Tea Leaves 500g", "Coffee Powder 250g",
    "Honey Organic 500g", "Mixed Spices Pack", "Oats Rolled 1kg", "Cornflakes 500g",
  ],
  Clothing: [
    "Cotton T-Shirt Round Neck", "Denim Jeans Slim Fit", "Formal Shirt White",
    "Sports Shorts", "Winter Jacket", "Cotton Socks Pack of 6", "Polo T-Shirt",
    "Cargo Pants", "Hoodie Pullover", "Track Pants", "Linen Shirt", "Kurta Cotton",
  ],
  Pharmaceuticals: [
    "Paracetamol 500mg Tablets", "Vitamin C 1000mg", "Bandage Roll 5m",
    "Antiseptic Liquid 100ml", "Cough Syrup 100ml", "Pain Relief Gel 50g",
    "First Aid Kit Basic", "Digital Thermometer", "Hand Sanitizer 500ml",
    "Face Masks N95 Pack of 10", "Multivitamin Tablets 60s", "Calcium Tablets 30s",
  ],
  Hardware: [
    "Screwdriver Set 12pc", "Hammer Claw 500g", "Drill Machine 13mm",
    "Measuring Tape 5m", "Wrench Set 8pc", "Plier Combination 8\"",
    "Electric Tester", "Wire Cutter 6\"", "Spirit Level 12\"",
    "Adjustable Spanner 10\"", "Allen Key Set", "Socket Set 40pc",
  ],
  Stationery: [
    "Notebook A4 200 Pages", "Ball Pen Pack of 10", "Pencil HB Pack of 12",
    "Highlighter Set 6 Colors", "Stapler Heavy Duty", "Paper Clips Box 100",
    "Sticky Notes 3x3", "File Folder A4", "Whiteboard Marker Set",
    "Scissors 8\"", "Tape Dispenser", "Calculator Scientific",
  ],
  "Home & Kitchen": [
    "Non-Stick Pan 26cm", "Pressure Cooker 5L", "Glass Container Set 5pc",
    "Cutting Board Wooden", "Kitchen Knife Set 6pc", "Mixing Bowl Set 3pc",
    "Water Bottle 1L Steel", "Coffee Mug Ceramic", "Dinner Plate Set 6pc",
    "Towel Set Cotton 4pc", "Bedsheet Double", "Pillow Memory Foam",
  ],
  Sports: [
    "Cricket Bat English Willow", "Football Size 5", "Badminton Racket Pair",
    "Yoga Mat 6mm", "Dumbbell Set 5kg Pair", "Skipping Rope", "Tennis Ball Pack 3",
    "Sports Water Bottle 750ml", "Resistance Band Set", "Running Shoes",
    "Swimming Goggles", "Gym Gloves", "Fitness Tracker Band",
  ],
  Automotive: [
    "Engine Oil 5W-30 4L", "Car Air Freshener", "Tyre Inflator 12V",
    "Car Vacuum Cleaner", "Seat Cover Universal", "Dashboard Polish 250ml",
    "Wiper Blade 22\"", "Car Battery 12V", "Headlight Bulb H4",
    "Brake Fluid 500ml", "Coolant 1L", "Spark Plug Set 4pc",
  ],
  "Beauty & Personal Care": [
    "Shampoo Anti-Dandruff 400ml", "Face Wash Gel 150ml", "Moisturizer SPF 30 100ml",
    "Deodorant Roll-On 50ml", "Hair Oil Coconut 200ml", "Sunscreen Lotion 100ml",
    "Toothpaste 200g", "Body Lotion 400ml", "Razor Cartridge 4 Pack",
    "Perfume Eau de Toilette 100ml", "Lip Balm", "Hand Cream 50g",
  ],
};

// ─── HSN CODES BY CATEGORY ────────────────────────────────────────────────────

const hsnCodesByCategory: Record<InventoryCategory, string[]> = {
  Electronics: ["8544", "8471", "8518", "8507", "9405"],
  Groceries: ["1006", "1509", "1101", "1701", "0713"],
  Clothing: ["6109", "6203", "6205", "6204", "6201"],
  Pharmaceuticals: ["3004", "2936", "3005", "3402", "9018"],
  Hardware: ["8205", "8202", "8467", "9017", "8204"],
  Stationery: ["4820", "9608", "9609", "9610", "8214"],
  "Home & Kitchen": ["7323", "7615", "7013", "4419", "8211"],
  Sports: ["9506", "9506", "9506", "9506", "9506"],
  Automotive: ["2710", "3307", "8414", "8508", "8708"],
  "Beauty & Personal Care": ["3305", "3304", "3304", "3307", "3305"],
};

// ─── BRANDS BY CATEGORY ───────────────────────────────────────────────────────

const brandsByCategory: Record<InventoryCategory, string[]> = {
  Electronics: ["Anker", "Logitech", "JBL", "Xiaomi", "Philips", "Belkin"],
  Groceries: ["Aashirvaad", "Fortune", "Tata", "India Gate", "Patanjali", "MDH"],
  Clothing: ["Allen Solly", "Peter England", "Levi's", "Nike", "Adidas", "Puma"],
  Pharmaceuticals: ["Cipla", "Sun Pharma", "Dr. Morepen", "Himalaya", "Dettol"],
  Hardware: ["Stanley", "Bosch", "Black+Decker", "Taparia", "Dewalt"],
  Stationery: ["Classmate", "Camlin", "Faber-Castell", "Reynolds", "Cello"],
  "Home & Kitchen": ["Prestige", "Pigeon", "Borosil", "Milton", "Tupperware"],
  Sports: ["Cosco", "Yonex", "Nivia", "Decathlon", "Fitbit", "Nike"],
  Automotive: ["Castrol", "Shell", "3M", "Bosch", "Exide", "Amaron"],
  "Beauty & Personal Care": ["Dove", "Nivea", "Lakme", "L'Oreal", "Himalaya", "Biotique"],
};

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysAgo));
  return date.toISOString().split("T")[0] ?? "";
}

function generateBarcode(): string {
  return Array.from({ length: 13 }, () => randomInt(0, 9)).join("");
}

function generateSKU(category: InventoryCategory, index: number): string {
  const prefix = category.substring(0, 3).toUpperCase();
  return `${prefix}-${String(index).padStart(5, "0")}`;
}

// ─── GENERATE INVENTORY DATA ──────────────────────────────────────────────────

export function generateInventory(count: number): InventoryItem[] {
  const items: InventoryItem[] = [];

  for (let i = 0; i < count; i++) {
    const category = randomItem(inventoryCategories);
    const names = productNamesByCategory[category];
    const brands = brandsByCategory[category];
    const hsnCodes = hsnCodesByCategory[category];
    const supplier = randomItem(suppliers);

    // Calculate pricing
    const costPrice = randomFloat(50, 5000);
    const margin = randomFloat(10, 40); // 10-40% margin
    const sellingPrice = parseFloat((costPrice * (1 + margin / 100)).toFixed(2));
    const mrp = parseFloat((sellingPrice * randomFloat(1.05, 1.20)).toFixed(2));
    const discount = randomFloat(0, 15);
    const taxRate = randomItem([5, 12, 18, 28]); // GST slabs

    // Stock levels
    const maxStock = randomInt(50, 500);
    const minStock = randomInt(5, 20);
    const reorderPoint = randomInt(minStock + 5, minStock + 30);
    const currentStock = randomInt(0, maxStock);

    // Determine status based on stock
    let status: InventoryStatus;
    if (currentStock === 0) {
      status = Math.random() > 0.5 ? "out_of_stock" : "on_order";
    } else if (currentStock <= minStock) {
      status = "low_stock";
    } else if (Math.random() > 0.95) {
      status = "discontinued";
    } else {
      status = "in_stock";
    }

    // Sales metrics
    const totalSold = randomInt(100, 10000);
    const totalRevenue = parseFloat((totalSold * sellingPrice * (1 - discount / 100)).toFixed(2));
    const avgMonthlySales = randomInt(20, 200);

    // Determine unit based on category
    let unit: UnitType;
    if (category === "Groceries") {
      unit = randomItem(["Kg", "Gram", "Liter", "Pack"]);
    } else if (category === "Clothing") {
      unit = randomItem(["Piece", "Pair", "Pack"]);
    } else if (category === "Pharmaceuticals") {
      unit = randomItem(["Piece", "Box", "Pack", "Ml"]);
    } else {
      unit = randomItem(["Piece", "Box", "Pack"]);
    }

    const item: InventoryItem = {
      id: `inv-${String(i + 1).padStart(6, "0")}`,
      sku: generateSKU(category, i + 1),
      name: randomItem(names),
      category,
      brand: randomItem(brands),
      unit,

      currentStock,
      minStockLevel: minStock,
      maxStockLevel: maxStock,
      reorderPoint,

      costPrice,
      sellingPrice,
      mrp,
      taxRate,
      discount,

      hsnCode: String(randomItem(hsnCodes)),
      barcode: generateBarcode(),

      supplierId: supplier.id,
      supplierName: supplier.name,
      leadTimeDays: randomInt(2, 14),

      status,
      lastRestockDate: randomDate(60),
      lastSaleDate: randomDate(30),
      expiryDate: category === "Groceries" || category === "Pharmaceuticals"
        ? (() => {
            const d = new Date();
            d.setMonth(d.getMonth() + randomInt(3, 24));
            return d.toISOString().split("T")[0];
          })()
        : undefined,

      warehouseLocation: randomItem(warehouseLocations),
      shelfNumber: `${String.fromCharCode(65 + randomInt(0, 5))}-${randomInt(1, 20)}`,

      totalSold,
      totalRevenue,
      avgMonthlySales,
    };

    items.push(item);
  }

  return items;
}
