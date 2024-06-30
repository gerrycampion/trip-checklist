import {
  Autocomplete,
  AutocompleteChangeDetails,
  AutocompleteChangeReason,
  Chip,
  IconButton,
  Stack,
  TextField,
} from "@mui/material";
import { RowValues } from "oh-my-spreadsheets/build/types/table";
import { checklistSchema, itemsCategoriesSchema } from "./types";
import { Dispatch, SetStateAction, SyntheticEvent } from "react";
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
  setChecklist,
}: {
  itemsCategories: RowValues<typeof itemsCategoriesSchema>[];
  setItemsCategories: Dispatch<
    SetStateAction<RowValues<typeof itemsCategoriesSchema>[]>
  >;
  groupByCol: "item" | "category";
  tagsCol: "item" | "category";
  onAdd: (group: string) => void;
  currentSheetName: string;
  setChecklist: Dispatch<SetStateAction<RowValues<typeof checklistSchema>[]>>;
}) {
  const getGroups = (ics: RowValues<typeof itemsCategoriesSchema>[]) =>
    Array.from(new Set(ics.map((ic) => ic[tagsCol]))).filter(
      (category) => category !== undefined
    );

  const groupsByValue = groupBy(itemsCategories, groupByCol, (ic1, ic2) =>
    (ic1[tagsCol] ?? "")
      .toLowerCase()
      .localeCompare((ic2[tagsCol] ?? "").toLowerCase())
  );
  const allGroups = getGroups(itemsCategories);
  allGroups.sort();

  const onAutoCompleteChange = async (
    group: string,
    event: SyntheticEvent<Element, Event>,
    tags: string[],
    reason: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails<string>
  ) => {
    console.log({ group, event, tags, reason, details });
    const itemCategory = {
      [groupByCol]: group,
      [tagsCol]: details?.option ?? "",
    } as { item: string; category: string };
    if (["createOption", "selectOption"].includes(reason)) {
      setItemsCategories([
        ...itemsCategories,
        {
          ...itemCategory,
          __tableRowIndex: itemsCategories.length,
        },
      ]);
      const ics = await addItemCategory(itemCategory);
      setItemsCategories(ics);
    } else if (reason === "removeOption" && event.type === "click") {
      setItemsCategories(
        itemsCategories.filter(
          (ic) => ic[groupByCol] !== group || ic[tagsCol] !== details?.option
        )
      );
      const ics = await deleteItemCategory(itemCategory);
      setItemsCategories(ics);
    }
  };

  const onGroupChange = async (event: any) => {
    if (event.keyCode === 13 /* Enter */) {
      await update(
        currentSheetName,
        groupByCol,
        event.target.defaultValue,
        event.target.value
      );
      setItemsCategories(await readItemsCategories());
      setChecklist(await readChecklist(currentSheetName));
    }
  };

  return (
    <Stack spacing={1} sx={{ width: "100%" }}>
      {Object.entries(groupsByValue).map(([group, tags]) => (
        <Stack
          key={`tagger-${group}`}
          spacing={1}
          direction={"row"}
          sx={{ width: "100%" }}
        >
          <IconButton onClick={() => onAdd(group)}>
            <Add />
          </IconButton>
          <TextField defaultValue={group} onKeyUp={onGroupChange} />
          <Autocomplete
            sx={{ width: "100%" }}
            disableClearable
            freeSolo
            multiple
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
              />
            )}
          />
        </Stack>
      ))}
    </Stack>
  );
}
