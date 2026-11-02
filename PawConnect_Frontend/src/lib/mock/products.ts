import { type ProductItem } from "./data";

export type { ProductItem };

export interface EnrichedProductItem extends ProductItem {
  category: string;
  categoryId?: number;
  petType?: "dog" | "cat" | "all";
  highlights?: string[];
  specs?: Record<string, string>;
  specifications?: Record<string, string>;
  tags?: string[];
  stockQuantity: number;
  stockStatus: "in-stock" | "low-stock" | "out-of-stock";
  inHouseGuaranteed: boolean;
  inStock?: boolean;
  image?: string;
}

export const IN_HOUSE_PRODUCTS: EnrichedProductItem[] = [];
