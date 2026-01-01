export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  subcategory: string;
  brand: string;
  price: number;
  compareAtPrice: number | null;
  cost: number;
  quantity: number;
  status: ProductStatus;
  visibility: ProductVisibility;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  weight: number;
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory = "electronics" | "clothing" | "home" | "sports" | "beauty" | "toys";
export type ProductStatus = "active" | "draft" | "archived" | "out_of_stock";
export type ProductVisibility = "visible" | "hidden" | "catalog_only" | "search_only";

export const categories: ProductCategory[] = ["electronics", "clothing", "home", "sports", "beauty", "toys"];
export const statuses: ProductStatus[] = ["active", "draft", "archived", "out_of_stock"];
export const visibilities: ProductVisibility[] = ["visible", "hidden", "catalog_only", "search_only"];

export const subcategories: Record<ProductCategory, string[]> = {
  electronics: ["Phones", "Laptops", "Tablets", "Accessories", "Audio", "Cameras"],
  clothing: ["Shirts", "Pants", "Dresses", "Shoes", "Outerwear", "Accessories"],
  home: ["Furniture", "Decor", "Kitchen", "Bedding", "Lighting", "Storage"],
  sports: ["Fitness", "Outdoor", "Team Sports", "Water Sports", "Cycling", "Golf"],
  beauty: ["Skincare", "Makeup", "Haircare", "Fragrance", "Bath & Body", "Tools"],
  toys: ["Action Figures", "Board Games", "Dolls", "Educational", "Outdoor", "Puzzles"],
};

export const brands = [
  "TechPro", "StyleCraft", "HomeEssentials", "SportMax", "BeautyGlow", "FunTime",
  "InnovateTech", "UrbanWear", "CozyLiving", "ActiveLife", "GlamourBox", "PlayWorld",
  "SmartGear", "FashionForward", "NestWell", "FitZone", "PureRadiance", "JoyBox",
];
