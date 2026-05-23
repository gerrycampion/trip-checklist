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
import { Box, CircularProgress, ListSubheader } from "@mui/material";
import { deleteItem, setChecked } from "./actions/google-sheets";

export default function CheckboxList({
  currentSheetName,
  itemsCategories,
  checklist,
  setChecklist,
  onError,
  onSuccess,
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
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}) {
  const [pendingItems, setPendingItems] = useState<Set<string>>(new Set());

  const addPending = (item: string) =>
    setPendingItems((prev) => new Set(prev).add(item));
  const removePending = (item: string) =>
    setPendingItems((prev) => {
      const next = new Set(prev);
      next.delete(item);
      return next;
    });
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
    },
  );

  const toggleCheck = async (value: string) => {
    const prevChecklist = checklist;
    const checked =
      checklist.find(({ item }) => item === value).checked !== "TRUE";
    addPending(value);
    setChecklist(
      checklist.map((cl) =>
        cl.item === value ? { ...cl, checked: checked ? "TRUE" : "FALSE" } : cl,
      ),
    );
    try {
      const result = await setChecked(currentSheetName, value, checked);
      setChecklist(result);
      onSuccess(checked ? "Item checked" : "Item unchecked");
    } catch {
      setChecklist(prevChecklist);
      onError("Failed to update item");
    } finally {
      removePending(value);
    }
  };

  const onDelete = async (value: string) => {
    const prevChecklist = checklist;
    addPending(value);
    setChecklist(checklist.filter((cl) => cl.item !== value));
    try {
      const result = await deleteItem(currentSheetName, value);
      setChecklist(result);
      onSuccess("Item removed");
    } catch {
      setChecklist(prevChecklist);
      onError("Failed to delete item");
    } finally {
      removePending(value);
    }
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
                  onClick={() => !pendingItems.has(item) && toggleCheck(item)}
                  dense
                >
                  <ListItemIcon>
                    {pendingItems.has(item) ? (
                      <CircularProgress size={24} sx={{ ml: "3px" }} />
                    ) : (
                      <Checkbox
                        edge="start"
                        checked={checked === "TRUE"}
                        tabIndex={-1}
                        disableRipple
                        inputProps={{ "aria-labelledby": labelId }}
                      />
                    )}
                  </ListItemIcon>
                  <IconButton
                    aria-label="comments"
                    disabled={pendingItems.has(item)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item);
                    }}
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
