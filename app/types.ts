export const itemsCategoriesSheet = "Items_Categories";

export const itemsCategoriesSchema = {
  A: "item",
  B: "category",
} as const;

export interface ItemCategory {
  item: string;
  category: string;
}
