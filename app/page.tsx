"use client";
import { RowValues } from "oh-my-spreadsheets/build/types/table";
import Tagger from "./tagger";
import { itemsCategoriesSchema, itemsCategoriesSheet } from "./types";
import { readItemsCategories, readSheetNames } from "./actions/google-sheets";
import { useEffect, useState } from "react";
import { Stack, Tab } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { sheets_v4 } from "googleapis";
import SheetList from "./sheetList";

// TODO:
// checklist view
// Fix sizing
// Create table, item, and category
// Rename table, item, and category
// Delete table
// Add to checklist

export default function Home() {
  const [itemsCategories, setItemsCategories] = useState<
    RowValues<typeof itemsCategoriesSchema>[]
  >([]);
  const [tab, setTab] = useState("Items");
  const [sheets, setSheets] = useState<sheets_v4.Schema$Sheet[]>([]);
  const [currentSheet, setCurrentSheet] = useState<string>("");

  const getItemsCategories = async () => {
    const ics = await readItemsCategories();
    setItemsCategories(ics);
  };

  const getSheetNames = async () => {
    const sns = await readSheetNames();
    setCurrentSheet(
      (
        sns.find((sheet) => sheet.properties?.title.startsWith("*")) ??
        sns.find((sheet) => sheet.properties?.title !== itemsCategoriesSheet)
      )?.properties?.title
    );
    setSheets(sns);
  };

  useEffect(() => {
    getSheetNames();
    getItemsCategories();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newTab: string) => {
    setTab(newTab);
  };

  return (
    <TabContext value={tab}>
      <Stack direction={"row"}>
        <TabList
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          // orientation="vertical"
          // sx={{ borderRight: 1, borderColor: "divider" }}
        >
          <Tab label="Items" value="Items" />
          <Tab label="Categories" value="Categories" />
          <Tab label={currentSheet} value={currentSheet}></Tab>
        </TabList>
        <SheetList
          sheets={sheets}
          currentSheet={currentSheet}
          getSheetNames={getSheetNames}
        />
      </Stack>
      <TabPanel value="Items">
        <Tagger
          itemsCategories={itemsCategories}
          setItemsCategories={setItemsCategories}
          groupByCol="item"
          valuesCol="category"
        />
      </TabPanel>
      <TabPanel value="Categories">
        <Tagger
          itemsCategories={itemsCategories}
          setItemsCategories={setItemsCategories}
          groupByCol="category"
          valuesCol="item"
        />
      </TabPanel>
      <TabPanel key={currentSheet} value={currentSheet}>
        {currentSheet}
      </TabPanel>
    </TabContext>
  );
}
