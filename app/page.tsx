"use client";
import { RowValues } from "oh-my-spreadsheets/build/types/table";
import Tagger from "./tagger";
import {
  checklistSchema,
  itemsCategoriesSchema,
  itemsCategoriesSheet,
} from "./types";
import {
  addCategory,
  addItem,
  readChecklist,
  readItemsCategories,
  readSheetNames,
} from "./actions/google-sheets";
import { useCallback, useEffect, useState } from "react";
import { Stack, Tab } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { sheets_v4 } from "googleapis";
import SheetList from "./sheetList";
import CheckboxList from "./checkboxList";

// TODO:
// react to changes (like checkbox) before syncing
// Add indicator for items in the tagger that are not in the checkboxlist
// Rename sheet method in oms
// use spreadsheets.values/batchGetByDataFilter and batch delete by data filter, etc
// print all sheets requests and troubleshoot "too many requests" error
// add auth
// Fix sizing - use fullwidth instead of %
// Create table, item, and category
// Rename table, item, and category
// Delete table
// checklist reset button

export default function Home() {
  const [itemsCategories, setItemsCategories] = useState<
    RowValues<typeof itemsCategoriesSchema>[]
  >([]);
  const [tab, setTab] = useState("Items");
  const [sheets, setSheets] = useState<sheets_v4.Schema$Sheet[]>([]);
  const [currentSheetName, setCurrentSheetName] = useState<string>("");
  const [checklist, setChecklist] = useState<
    RowValues<typeof checklistSchema>[]
  >([]);

  const getItemsCategories = async () => {
    const ics = await readItemsCategories();
    setItemsCategories(ics);
  };

  const getSheetNames = async () => {
    const sns = await readSheetNames();
    setCurrentSheetName(
      (
        sns.find((sheet) => sheet.properties?.title.startsWith("*")) ??
        sns.find((sheet) => sheet.properties?.title !== itemsCategoriesSheet)
      )?.properties?.title
    );
    setSheets(sns);
  };

  const getChecklist = useCallback(async () => {
    const cl = await readChecklist(currentSheetName);
    setChecklist(cl);
  }, [currentSheetName]);

  useEffect(() => {
    getSheetNames();
    getItemsCategories();
  }, []);

  useEffect(() => {
    getChecklist();
  }, [currentSheetName, getChecklist]);

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
          <Tab label={currentSheetName} value={currentSheetName} />
          <Tab label="Items" value="Items" />
          <Tab label="Categories" value="Categories" />
        </TabList>
        <SheetList
          sheets={sheets}
          currentSheetName={currentSheetName}
          getSheetNames={getSheetNames}
        />
      </Stack>
      <TabPanel key={currentSheetName} value={currentSheetName}>
        <CheckboxList
          currentSheetName={currentSheetName}
          itemsCategories={itemsCategories}
          checklist={checklist}
          setChecklist={setChecklist}
        />
      </TabPanel>
      <TabPanel value="Items">
        <Tagger
          itemsCategories={itemsCategories}
          setItemsCategories={setItemsCategories}
          groupByCol="item"
          tagsCol="category"
          onAdd={async (group) => {
            const sheet = await addItem(currentSheetName, group);
            getChecklist();
          }}
          currentSheetName={currentSheetName}
          setChecklist={setChecklist}
        />
      </TabPanel>
      <TabPanel value="Categories">
        <Tagger
          itemsCategories={itemsCategories}
          setItemsCategories={setItemsCategories}
          groupByCol="category"
          tagsCol="item"
          onAdd={async (group) => {
            const sheet = await addCategory(currentSheetName, group);
            getChecklist();
          }}
          currentSheetName={currentSheetName}
          setChecklist={setChecklist}
        />
      </TabPanel>
    </TabContext>
  );
}
