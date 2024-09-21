"use server";
import { Table } from "oh-my-spreadsheets";
import {
  itemsCategoriesSchema,
  ItemCategory,
  itemsCategoriesSheet,
  checklistSchema,
} from "../types";
import { google } from "googleapis";

const client = new google.auth.JWT(
  process.env.CLIENT_EMAIL,
  undefined,
  process.env.PRIVATE_KEY,
  ["https://www.googleapis.com/auth/spreadsheets"]
);
const gsapi = google.sheets({ version: "v4", auth: client });

const itemsCategoriesTable = new Table<typeof itemsCategoriesSchema>(
  itemsCategoriesSchema,
  {
    spreadsheetID: process.env.SPREADSHEET_ID!,
    sheet: itemsCategoriesSheet,
    email: process.env.CLIENT_EMAIL!,
    privateKey: process.env.PRIVATE_KEY!,
  }
);

function getChecklistTable(sheet: string) {
  return new Table<typeof checklistSchema>(checklistSchema, {
    spreadsheetID: process.env.SPREADSHEET_ID!,
    sheet: sheet,
    email: process.env.CLIENT_EMAIL!,
    privateKey: process.env.PRIVATE_KEY!,
  });
}

export async function readItemsCategories() {
  return itemsCategoriesTable.read();
}

export async function readChecklist(sheet: string) {
  return getChecklistTable(sheet).read();
}

export async function setChecked(
  sheet: string,
  value: string,
  checked: boolean
) {
  const table = getChecklistTable(sheet);
  await table.update({
    where: { item: value },
    data: { checked: checked ? "TRUE" : "FALSE" },
  });
  return table.read();
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

export async function createSheet(sheetName: string) {
  const table = getChecklistTable(sheetName);
  await table.createTable();
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

export async function addItem(sheet: string, item: string) {
  const table = getChecklistTable(sheet);
  const results = await table.read({
    where: { item },
  });
  if (results.length > 0) {
    return;
  }
  await table.create({ data: { item, checked: "false" } });
}

export async function deleteItem(sheet: string, item: string) {
  const table = getChecklistTable(sheet);
  await table.delete({ where: { item } });
  return table.read();
}

export async function addCategory(sheet: string, category: string) {
  const categoryResults = await itemsCategoriesTable.read({
    where: { category },
  });
  const checklistTable = getChecklistTable(sheet);
  const checklistResults = await checklistTable.read();
  const filtered = categoryResults.filter(
    (categoryResult) =>
      !checklistResults.some(
        (checklistResult) => checklistResult.item === categoryResult.item
      )
  );
  const data = filtered.map((result) => ({
    item: result.item,
    checked: "false",
  }));
  await checklistTable.create({ data: data });
}

export async function update(
  sheet: string,
  columnName: string,
  previousValue: string,
  newValue: string
) {
  await itemsCategoriesTable.update({
    where: { [columnName]: previousValue },
    data: { [columnName]: newValue },
  });
  if (columnName === "item") {
    const checklistTable = getChecklistTable(sheet);
    await checklistTable.update({
      where: { [columnName]: previousValue },
      data: { [columnName]: newValue },
    });
  }
}
