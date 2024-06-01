"use client";
import { RowValues } from "oh-my-spreadsheets/build/types/table";
import Tagger from "./tagger";
import { itemsCategoriesSchema } from "./types";
import { readItemsCategories, readSheetNames } from "./actions/google-sheets";
import { useEffect, useState } from "react";
import { Box, Tab } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { sheets_v4 } from "googleapis";

// TODO:
// checklist view
// Fix sizing
// Create table, item, and category
// Add to checklist
// Specify default checklist


export default function Home() {
  const [itemsCategories, setItemsCategories] = useState<
    RowValues<typeof itemsCategoriesSchema>[]
  >([]);
  const [tab, setTab] = useState("Items");
  const [sheets, setSheets] = useState<sheets_v4.Schema$Sheet[]>([]);

  const getItemsCategories = async () => {
    const ics = await readItemsCategories();
    setItemsCategories(ics);
  };

  const getSheetNames = async () => {
    const sns = await readSheetNames();
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
    <Box sx={{ width: "100%", typography: "body1" }}>
      <TabContext value={tab}>
        <Box
        // sx={{
        //   flexGrow: 1,
        //   bgcolor: "background.paper",
        //   display: "flex",
        //   height: 224,
        // }}
        >
          <TabList
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            // orientation="vertical"
            // sx={{ borderRight: 1, borderColor: "divider" }}
          >
            <Tab label="Items" value="Items" />
            <Tab label="Categories" value="Categories" />
            {...sheets.map((sheet) => (
              <Tab
                label={sheet.properties?.title}
                value={sheet.properties?.title}
              />
            ))}
          </TabList>
        </Box>
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
        {...sheets.map((sheet) => (
          <TabPanel
            key={sheet.properties?.title}
            value={sheet.properties?.title}
          >
            {sheet.properties?.title}
          </TabPanel>
        ))}
      </TabContext>
    </Box>
  );
}
