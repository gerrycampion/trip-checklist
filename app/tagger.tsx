import {
  Autocomplete,
  AutocompleteChangeDetails,
  AutocompleteChangeReason,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
} from "@mui/material";
import { RowValues } from "oh-my-spreadsheets/build/types/table";
import { checklistSchema, itemsCategoriesSchema } from "./types";
import { Dispatch, SetStateAction, SyntheticEvent, useState } from "react";
import {
  addItemCategory,
  deleteItemCategory,
  readChecklist,
  readItemsCategories,
  update,
} from "./actions/google-sheets";
import { Add } from "@mui/icons-material";
import { groupBy } from "./utils";

export default function Tagger({
  itemsCategories,
  setItemsCategories,
  groupByCol,
  tagsCol,
  onAdd,
  currentSheetName,
  checklist,
  setChecklist,
  onError,
  onSuccess,
}: {
  itemsCategories: RowValues<typeof itemsCategoriesSchema>[];
  setItemsCategories: Dispatch<
    SetStateAction<RowValues<typeof itemsCategoriesSchema>[]>
  >;
  groupByCol: "item" | "category";
  tagsCol: "item" | "category";
  onAdd: (group: string) => Promise<void>;
  currentSheetName: string;
  checklist: RowValues<typeof checklistSchema>[];
  setChecklist: Dispatch<SetStateAction<RowValues<typeof checklistSchema>[]>>;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}) {
  const getGroups = (ics: RowValues<typeof itemsCategoriesSchema>[]) =>
    Array.from(new Set(ics.map((ic) => ic[tagsCol]))).filter(
      (category) => category !== undefined,
    );

  const checklistItems = new Set(checklist.map((cl) => cl.item));

  const [pendingGroups, setPendingGroups] = useState<Set<string>>(new Set());
  const [pendingAddGroups, setPendingAddGroups] = useState<Set<string>>(
    new Set(),
  );

  const addPending = (set: "groups" | "add", key: string) => {
    const setter = set === "groups" ? setPendingGroups : setPendingAddGroups;
    setter((prev) => new Set(prev).add(key));
  };
  const removePending = (set: "groups" | "add", key: string) => {
    const setter = set === "groups" ? setPendingGroups : setPendingAddGroups;
    setter((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const groupsByValue = groupBy(itemsCategories, groupByCol, (ic1, ic2) =>
    (ic1[tagsCol] ?? "")
      .toLowerCase()
      .localeCompare((ic2[tagsCol] ?? "").toLowerCase()),
  );
  const allGroups = getGroups(itemsCategories);
  allGroups.sort();

  const onAutoCompleteChange = async (
    group: string,
    event: SyntheticEvent<Element, Event>,
    tags: string[],
    reason: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails<string>,
  ) => {
    console.log({ group, event, tags, reason, details });
    const itemCategory = {
      [groupByCol]: group,
      [tagsCol]: details?.option ?? "",
    } as { item: string; category: string };
    if (["createOption", "selectOption"].includes(reason)) {
      const prevIcs = itemsCategories;
      addPending("groups", group);
      setItemsCategories([
        ...itemsCategories,
        {
          ...itemCategory,
          __tableRowIndex: itemsCategories.length,
        },
      ]);
      try {
        const ics = await addItemCategory(itemCategory);
        setItemsCategories(ics);
        onSuccess("Tag added");
      } catch {
        setItemsCategories(prevIcs);
        onError("Failed to add tag");
      } finally {
        removePending("groups", group);
      }
    } else if (reason === "removeOption" && event.type === "click") {
      const prevIcs = itemsCategories;
      addPending("groups", group);
      setItemsCategories(
        itemsCategories.filter(
          (ic) => ic[groupByCol] !== group || ic[tagsCol] !== details?.option,
        ),
      );
      try {
        const ics = await deleteItemCategory(itemCategory);
        setItemsCategories(ics);
        onSuccess("Tag removed");
      } catch {
        setItemsCategories(prevIcs);
        onError("Failed to remove tag");
      } finally {
        removePending("groups", group);
      }
    }
  };

  const onGroupChange = async (event: any) => {
    if (event.keyCode === 13 /* Enter */) {
      const groupName = event.target.defaultValue;
      addPending("groups", groupName);
      try {
        await update(
          currentSheetName,
          groupByCol,
          groupName,
          event.target.value,
        );
        setItemsCategories(await readItemsCategories());
        setChecklist(await readChecklist(currentSheetName));
        onSuccess("Renamed");
      } catch {
        onError("Failed to rename item");
      } finally {
        removePending("groups", groupName);
      }
    }
  };

  const handleAdd = async (group: string) => {
    addPending("add", group);
    try {
      await onAdd(group);
    } finally {
      removePending("add", group);
    }
  };

  return (
    <Stack spacing={1} sx={{ width: "100%" }}>
      {Array.from(groupsByValue.entries(), ([group, tags]) => (
        <Stack
          key={`tagger-${group}`}
          spacing={1}
          direction={"row"}
          sx={{ width: "100%" }}
        >
          <IconButton
            onClick={() => handleAdd(group)}
            disabled={
              (groupByCol === "item" && checklistItems.has(group)) ||
              pendingAddGroups.has(group)
            }
          >
            {pendingAddGroups.has(group) ? (
              <CircularProgress size={24} />
            ) : (
              <Add />
            )}
          </IconButton>
          <TextField
            defaultValue={group}
            onKeyUp={onGroupChange}
            type="search"
            disabled={pendingGroups.has(group)}
          />
          <Autocomplete
            sx={{ width: "100%" }}
            disableClearable
            freeSolo
            multiple
            loading={pendingGroups.has(group)}
            options={allGroups}
            value={tags.filter((ic) => ic[tagsCol]).map((ic) => ic[tagsCol])}
            onChange={(event: any, newTags: string[], reason, details) => {
              onAutoCompleteChange(group, event, newTags, reason, details);
            }}
            renderTags={(vs: readonly string[], getTagProps) =>
              vs.map((option: string, index: number) => (
                <Chip
                  variant="outlined"
                  label={option}
                  {...getTagProps({ index })}
                  key={getTagProps({ index }).key}
                  sx={
                    tagsCol === "item" && !checklistItems.has(option)
                      ? { backgroundColor: "white" }
                      : undefined
                  }
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                id={group}
                variant="filled"
                label={group}
                placeholder="Tags"
                type="search"
              />
            )}
          />
        </Stack>
      ))}
    </Stack>
  );
}
