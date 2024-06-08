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
import { useEffect, useState } from "react";
import { Stack, Tab } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { sheets_v4 } from "googleapis";
import SheetList from "./sheetList";
import CheckboxList from "./checkboxList";

// TODO:
// delete checklist item
// Fix sizing
// Create table, item, and category
// Rename table, item, and category
// Delete table


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

  const getChecklist = async () => {
    const cl = await readChecklist(currentSheetName);
    setChecklist(cl);
  };

  useEffect(() => {
    getSheetNames();
    getItemsCategories();
  }, []);

  useEffect(() => {
    getChecklist();
  }, [currentSheetName]);

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
          <Tab label={currentSheetName} value={currentSheetName}/>
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
          valuesCol="category"
          onAdd={async (group) => {
            const sheet = await addItem(currentSheetName, group);
            getChecklist();
          }}
        />
      </TabPanel>
      <TabPanel value="Categories">
        <Tagger
          itemsCategories={itemsCategories}
          setItemsCategories={setItemsCategories}
          groupByCol="category"
          valuesCol="item"
          onAdd={async (group) => {
            const sheet = await addCategory(currentSheetName, group);
            getChecklist();
          }}
        />
      </TabPanel>
    </TabContext>
  );
}
