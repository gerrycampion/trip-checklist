import { Dispatch, SetStateAction, useState } from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import { Delete } from "@mui/icons-material";
import { RowValues } from "oh-my-spreadsheets/build/types/table";
import { checklistSchema, itemsCategoriesSchema } from "./types";
import { ALL, groupBy, unique } from "./utils";
import { Box, ListSubheader } from "@mui/material";
import { deleteItem, setChecked } from "./actions/google-sheets";

export default function CheckboxList({
  currentSheetName,
  itemsCategories,
  checklist,
  setChecklist,
}: {
  currentSheetName: string;
  itemsCategories: RowValues<typeof itemsCategoriesSchema>[];
  checklist: RowValues<typeof checklistSchema>[];
  setChecklist: Dispatch<
    SetStateAction<
      RowValues<{
        readonly A: "item";
        readonly B: "checked";
      }>[]
    >
  >;
}) {
  const itemsByCategory = groupBy(
    [...unique(itemsCategories, "item", "category", ALL), ...itemsCategories]
      .map(({ item: item1, category }) => {
        const checkItem = checklist.find(({ item: item2 }) => item1 === item2);
        return checkItem
          ? { item: item1, category, checked: checkItem.checked }
          : undefined;
      })
      .filter((item) => item),
    "category",
    (ic1, ic2) => {
      if (ic1["checked"] === "TRUE" && ic2["checked"] !== "TRUE") return 1;
      if (ic1["checked"] !== "TRUE" && ic2["checked"] === "TRUE") return -1;
      return (ic1["item"] ?? "")
        .toLowerCase()
        .localeCompare((ic2["item"] ?? "").toLowerCase());
    }
  );

  const toggleCheck = async (value: string) => {
    const checked =
      checklist.find(({ item }) => item === value).checked !== "TRUE";
    const result = await setChecked(currentSheetName, value, checked);
    setChecklist(result);
  };

  const onDelete = async (value: string) => {
    const result = await deleteItem(currentSheetName, value);
    setChecklist(result);
  };

  return (
    <>
      {Array.from(itemsByCategory.entries(), ([group, values]) => (
        <List
          key={`checklist-${group}`}
          sx={{ width: "100%", bgcolor: "background.paper" }}
          subheader={<ListSubheader>{group}</ListSubheader>}
          dense={true}
        >
          {values.map(({ item, category, checked }) => {
            const labelId = `checkbox-list-label-${item}`;
            return (
              <ListItem
                key={item}
                // secondaryAction={
                // Button could go here, but it shows up all the way on the right
                // }
                disablePadding
                style={{
                  textDecoration: checked === "TRUE" ? "line-through" : "none",
                }}
              >
                <ListItemButton
                  role={undefined}
                  onClick={() => toggleCheck(item)}
                  dense
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={checked === "TRUE"}
                      tabIndex={-1}
                      disableRipple
                      inputProps={{ "aria-labelledby": labelId }}
                    />
                  </ListItemIcon>
                  <IconButton
                    aria-label="comments"
                    onClick={() => onDelete(item)}
                  >
                    <Delete />
                  </IconButton>
                  <Box sx={{ px: "20px" }} />
                  <ListItemText id={labelId} primary={item} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      ))}
    </>
  );
}
