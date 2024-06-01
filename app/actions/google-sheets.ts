"use server";
import { Table } from "oh-my-spreadsheets";
import { itemsCategoriesSchema, ItemCategory } from "../types";

const itemsCategoriesTable = new Table<typeof itemsCategoriesSchema>(
  itemsCategoriesSchema,
  {
    spreadsheetID: process.env.SPREADSHEET_ID!,
    sheet: "Items_Categories",
    email: process.env.CLIENT_EMAIL!,
    privateKey: process.env.PRIVATE_KEY!,
  }
);

export async function readItemsCategories() {
  return itemsCategoriesTable.read();
}

export async function addItemCategory(ic: ItemCategory) {
  const data = { item: ic.item, category: ic.category };
  await itemsCategoriesTable.delete({
    where: { item: ic.item, category: undefined },
  });
  await itemsCategoriesTable.delete({
    where: { item: undefined, category: ic.category },
  });
  const itemsAndCategory = await itemsCategoriesTable.read({
    where: data,
    limit: 1,
  });
  if (itemsAndCategory.length === 0) {
    await itemsCategoriesTable.create({
      data: data,
    });
  }
  return readItemsCategories();
}

export async function deleteItemCategory(ic: ItemCategory) {
  const data = { item: ic.item, category: ic.category };
  await itemsCategoriesTable.delete({
    where: data,
  });
  return readItemsCategories();
}

export async function readSheetNames() {
  return itemsCategoriesTable.readSheets();
}
