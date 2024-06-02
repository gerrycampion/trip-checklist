"use client";
import { RowValues } from "oh-my-spreadsheets/build/types/table";
import Tagger from "./tagger";
import { itemsCategoriesSchema, itemsCategoriesSheet } from "./types";
import {
  activateSheet,
  readItemsCategories,
  readSheetNames,
} from "./actions/google-sheets";
import { useEffect, useState } from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Tab,
} from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { sheets_v4 } from "googleapis";

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

  const handleListChange = async (event: SelectChangeEvent) => {
    const sheetName = event.target.value as string;
    setCurrentSheet(sheetName);
    await activateSheet(sheetName);
    getSheetNames();
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
        <FormControl>
          <InputLabel id="select-list-label">{"List"}</InputLabel>
          <Select
            labelId="select-list-label"
            id="select-list"
            value={currentSheet}
            label="List"
            onChange={handleListChange}
          >
            {sheets
              .filter(
                (sheet) => sheet?.properties?.title !== itemsCategoriesSheet
              )
              .map((sheet) => (
                <MenuItem value={sheet?.properties?.title}>
                  {sheet?.properties?.title}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
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
