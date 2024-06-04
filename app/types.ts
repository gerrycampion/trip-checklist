export const itemsCategoriesSheet = "Items_Categories";

export const itemsCategoriesSchema = {
  A: "item",
  B: "category",
} as const;

export interface ItemCategory {
  item: string;
  category: string;
}

export const checklistSchema = {
  A: "item",
  B: "checked",
} as const;

export interface Checklist {
  item: string;
  checked: "TRUE" | "FALSE";
}
