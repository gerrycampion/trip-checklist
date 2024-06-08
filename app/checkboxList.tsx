import { Dispatch, SetStateAction, useState } from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import CommentIcon from "@mui/icons-material/Comment";
import { RowValues } from "oh-my-spreadsheets/build/types/table";
import { checklistSchema, itemsCategoriesSchema } from "./types";
import { groupBy } from "./utils";
import { ListSubheader } from "@mui/material";
import { setChecked } from "./actions/google-sheets";

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
    itemsCategories
      .map(({ item: item1, category }) => {
        const checkItem = checklist.find(({ item: item2 }) => item1 === item2);
        return checkItem
          ? { item: item1, category, checked: checkItem.checked }
          : undefined;
      })
      .filter((item) => item),
    "category",
    "item"
  );

  const toggleCheck = async (value: string) => {
    const checked =
      checklist.find(({ item }) => item === value).checked !== "TRUE";
    const result = await setChecked(currentSheetName, value, checked);
    setChecklist(result);
  };

  return (
    <>
      {Object.entries(itemsByCategory).map(([group, values]) => (
        <List
          sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}
          subheader={<ListSubheader>{group}</ListSubheader>}
        >
          {values.map(({ item, category, checked }) => {
            const labelId = `checkbox-list-label-${item}`;
            return (
              <ListItem
                key={item}
                secondaryAction={
                  <IconButton edge="end" aria-label="comments">
                    <CommentIcon />
                  </IconButton>
                }
                disablePadding
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
