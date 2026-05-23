import {
  Autocomplete,
  AutocompleteChangeDetails,
  AutocompleteChangeReason,
  CircularProgress,
  TextField,
} from "@mui/material";
import { itemsCategoriesSheet } from "./types";
import { activateSheet, createSheet } from "./actions/google-sheets";
import { sheets_v4 } from "googleapis";
import { SyntheticEvent, useState } from "react";

export default function SheetList({
  sheets,
  currentSheetName,
  getSheetNames,
  onError,
  onSuccess,
}: {
  sheets: sheets_v4.Schema$Sheet[];
  currentSheetName: string;
  getSheetNames: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleListChange = async (
    event: SyntheticEvent<Element, Event>,
    value: string,
    reason: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails
  ) => {
    setLoading(true);
    try {
      if (reason === "createOption") {
        await createSheet(value);
      }
      if (["createOption", "selectOption"].includes(reason)) {
        await activateSheet(value);
        getSheetNames();
        onSuccess("List updated");
      }
    } catch {
      onError("Failed to update list");
    } finally {
      setLoading(false);
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
      loading={loading}
      renderInput={(params) => (
        <TextField
          {...params}
          label="List"
          type="search"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading && <CircularProgress color="inherit" size={20} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
