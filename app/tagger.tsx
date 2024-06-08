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
import { itemsCategoriesSchema } from "./types";
import { Dispatch, SetStateAction, SyntheticEvent } from "react";
import { addItemCategory, deleteItemCategory } from "./actions/google-sheets";
import { Add } from "@mui/icons-material";
import { groupBy } from "./utils";

export default function Tagger({
  itemsCategories,
  setItemsCategories,
  groupByCol,
  tagsCol,
  onAdd,
}: {
  itemsCategories: RowValues<typeof itemsCategoriesSchema>[];
  setItemsCategories: Dispatch<
    SetStateAction<RowValues<typeof itemsCategoriesSchema>[]>
  >;
  groupByCol: "item" | "category";
  tagsCol: "item" | "category";
  onAdd: (group: string) => void;
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
    } else if (reason === "removeOption") {
      setItemsCategories(
        itemsCategories.filter(
          (ic) => ic[groupByCol] !== group || ic[tagsCol] !== details?.option
        )
      );
      const ics = await deleteItemCategory(itemCategory);
      setItemsCategories(ics);
    }
  };

  return (
    <Stack spacing={1} sx={{ width: "100%" }}>
      {Object.entries(groupsByValue).map(([group, tags]) => (
        <Stack spacing={1} direction={"row"} sx={{ width: "100%" }}>
          <IconButton onClick={() => onAdd(group)}>
            <Add />
          </IconButton>
          <Autocomplete
            sx={{ width: "100%" }}
            disableClearable
            freeSolo
            multiple
            key={`tagger-${group}`}
            options={allGroups}
            value={tags
              .filter((ic) => ic[tagsCol])
              .map((ic) => ic[tagsCol])}
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
