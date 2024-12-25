import {
  Autocomplete,
  AutocompleteChangeDetails,
  AutocompleteChangeReason,
  TextField,
} from "@mui/material";
import { itemsCategoriesSheet } from "./types";
import { activateSheet, createSheet } from "./actions/google-sheets";
import { sheets_v4 } from "googleapis";
import { SyntheticEvent } from "react";

export default function SheetList({
  sheets,
  currentSheetName,
  getSheetNames,
}: {
  sheets: sheets_v4.Schema$Sheet[];
  currentSheetName: string;
  getSheetNames: () => void;
}) {
  const handleListChange = async (
    event: SyntheticEvent<Element, Event>,
    value: string,
    reason: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails
  ) => {
    if (reason === "createOption") {
      await createSheet(value);
    }
    if (["createOption", "selectOption"].includes(reason)) {
      await activateSheet(value);
      getSheetNames();
    }
  };

  return (
    <Autocomplete
      value={currentSheetName}
      onChange={handleListChange}
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      id="sheet-list"
      options={sheets
        .filter((sheet) => sheet?.properties?.title !== itemsCategoriesSheet)
        .map((sheet) => sheet?.properties?.title)}
      sx={{ width: 300 }}
      freeSolo
      renderInput={(params) => (
        <TextField {...params} label="List" type="search" />
      )}
    />
  );
}
