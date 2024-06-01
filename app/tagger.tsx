import {
  Autocomplete,
  AutocompleteChangeDetails,
  AutocompleteChangeReason,
  Chip,
  Stack,
  TextField,
} from "@mui/material";
import { RowValues } from "oh-my-spreadsheets/build/types/table";
import { itemsCategoriesSchema } from "./types";
import { Dispatch, SetStateAction, SyntheticEvent } from "react";
import { addItemCategory, deleteItemCategory } from "./actions/google-sheets";

export default function Tagger({
  itemsCategories,
  setItemsCategories,
  groupByCol,
  valuesCol,
}: {
  itemsCategories: RowValues<typeof itemsCategoriesSchema>[];
  setItemsCategories: Dispatch<
    SetStateAction<RowValues<typeof itemsCategoriesSchema>[]>
  >;
  groupByCol: "item" | "category";
  valuesCol: "item" | "category";
}) {
  const groupBy = <T extends { [key: string]: any }>(
    list: T[],
    key: string
  ): { [group: string]: T[] } =>
    list.reduce((aggregate: { [key: string]: T[] }, current) => {
      (aggregate[current[key]] = aggregate[current[key]] || []).push(current);
      return aggregate;
    }, {});

  const getCategoriesByItem = (
    ics: RowValues<typeof itemsCategoriesSchema>[]
  ) => groupBy(ics, groupByCol);

  const getCategories = (ics: RowValues<typeof itemsCategoriesSchema>[]) =>
    Array.from(new Set(ics.map((ic) => ic[valuesCol]))).filter(
      (category) => category !== undefined
    );

  const categoriesByItem = getCategoriesByItem(itemsCategories);
  const allCategories = getCategories(itemsCategories);

  const onAutoCompleteChange = async (
    item: string,
    event: SyntheticEvent<Element, Event>,
    value: string[],
    reason: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails<string>
  ) => {
    console.log({ item, event, value, reason, details });
    const itemCategory = {
      [groupByCol]: item,
      [valuesCol]: details?.option ?? "",
    };
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
          (ic) => ic[groupByCol] !== item || ic[valuesCol] !== details?.option
        )
      );
      const ics = await deleteItemCategory(itemCategory);
      setItemsCategories(ics);
    }
  };

  return (
    <Stack spacing={1} sx={{ width: 500 }}>
      {Object.entries(categoriesByItem).map(([item, categories]) => (
        <Autocomplete
          disableClearable
          freeSolo
          multiple
          key={`tagger-${item}`}
          options={allCategories}
          value={categories
            .filter((ic) => ic[valuesCol])
            .map((ic) => ic[valuesCol])}
          onChange={(event: any, value: string[], reason, details) => {
            onAutoCompleteChange(item, event, value, reason, details);
          }}
          renderTags={(value: readonly string[], getTagProps) =>
            value.map((option: string, index: number) => (
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
              label={item}
              placeholder="Tags"
            />
          )}
        />
      ))}
    </Stack>
  );
}
