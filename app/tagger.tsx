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

export default function Tagger({
  itemsCategories,
  setItemsCategories,
  groupByCol,
  valuesCol,
  onAdd,
}: {
  itemsCategories: RowValues<typeof itemsCategoriesSchema>[];
  setItemsCategories: Dispatch<
    SetStateAction<RowValues<typeof itemsCategoriesSchema>[]>
  >;
  groupByCol: "item" | "category";
  valuesCol: "item" | "category";
  onAdd: (group: string) => void;
}) {
  const groupBy = <T extends { [key: string]: any }>(
    list: T[],
    key: string
  ): { [group: string]: T[] } =>
    list.reduce((aggregate: { [key: string]: T[] }, current) => {
      (aggregate[current[key]] = aggregate[current[key]] || []).push(current);
      return aggregate;
    }, {});

  const getGroups = (ics: RowValues<typeof itemsCategoriesSchema>[]) =>
    Array.from(new Set(ics.map((ic) => ic[valuesCol]))).filter(
      (category) => category !== undefined
    );

  const groupsByValue = groupBy(itemsCategories, groupByCol);
  const allGroups = getGroups(itemsCategories);

  const onAutoCompleteChange = async (
    group: string,
    event: SyntheticEvent<Element, Event>,
    values: string[],
    reason: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails<string>
  ) => {
    console.log({ group, event, values, reason, details });
    const itemCategory = {
      [groupByCol]: group,
      [valuesCol]: details?.option ?? "",
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
          (ic) => ic[groupByCol] !== group || ic[valuesCol] !== details?.option
        )
      );
      const ics = await deleteItemCategory(itemCategory);
      setItemsCategories(ics);
    }
  };

  return (
    <Stack spacing={1} sx={{ width: 500 }}>
      {Object.entries(groupsByValue).map(([group, values]) => (
        <Stack spacing={1} direction={"row"} sx={{ width: 500 }}>
          <IconButton onClick={() => onAdd(group)}>
            <Add />
          </IconButton>
          <Autocomplete
            sx={{ width: 400 }}
            disableClearable
            freeSolo
            multiple
            key={`tagger-${group}`}
            options={allGroups}
            value={values
              .filter((ic) => ic[valuesCol])
              .map((ic) => ic[valuesCol])}
            onChange={(event: any, newValues: string[], reason, details) => {
              onAutoCompleteChange(group, event, newValues, reason, details);
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
