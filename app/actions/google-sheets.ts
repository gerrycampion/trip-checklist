"use server";
import { Table } from "oh-my-spreadsheets";
import {
  itemsCategoriesSchema,
  ItemCategory,
  itemsCategoriesSheet,
} from "../types";
import { google } from "googleapis";

const itemsCategoriesTable = new Table<typeof itemsCategoriesSchema>(
  itemsCategoriesSchema,
  {
    spreadsheetID: process.env.SPREADSHEET_ID!,
    sheet: itemsCategoriesSheet,
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

const client = new google.auth.JWT(
  process.env.CLIENT_EMAIL,
  undefined,
  process.env.PRIVATE_KEY,
  ["https://www.googleapis.com/auth/spreadsheets"]
);
const gsapi = google.sheets({ version: "v4", auth: client });

export async function createSheet(sheetName: string) {
  const result = await gsapi.spreadsheets.batchUpdate({
    spreadsheetId: process.env.SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetName,
            },
          },
        },
      ],
    },
  });
  return;
}

export async function activateSheet(sheetName: string) {
  const sheetNames = await readSheetNames();
  const newSheet = sheetNames.find(
    (sheet) => sheet.properties?.title === sheetName
  );
  const oldSheets = sheetNames.filter((sheet) =>
    sheet.properties?.title.startsWith("*")
  );
  const updateSheetProperties = [
    ...oldSheets.map((oldSheet) => ({
      updateSheetProperties: {
        properties: {
          sheetId: oldSheet.properties?.sheetId,
          title: oldSheet.properties?.title.replace("*", ""),
        },
        fields: "title",
      },
    })),
    {
      updateSheetProperties: {
        properties: {
          sheetId: newSheet.properties?.sheetId,
          title: `*${newSheet.properties?.title}`,
        },
        fields: "title",
      },
    },
  ];
  const result = await gsapi.spreadsheets.batchUpdate({
    spreadsheetId: process.env.SPREADSHEET_ID,
    requestBody: {
      requests: updateSheetProperties,
    },
  });
  return;
}
