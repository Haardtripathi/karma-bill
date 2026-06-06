import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

const formatPrice = (value) => Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });

export default function ItemPicker({ items = [], itemId = "", itemName = "", onSelect, onType }) {
  const selectedItem = items.find((item) => item._id === itemId) || null;

  return (
    <Autocomplete
      className="field item-combobox"
      freeSolo
      fullWidth
      size="small"
      options={items}
      value={selectedItem}
      inputValue={itemName || selectedItem?.name || ""}
      selectOnFocus
      handleHomeEndKeys
      clearOnBlur={false}
      getOptionLabel={(option) => typeof option === "string" ? option : option?.name || ""}
      isOptionEqualToValue={(option, value) => option._id === value?._id}
      onChange={(event, value) => {
        if (typeof value === "string") {
          onType(value);
          return;
        }
        if (value) {
          onSelect(value);
          return;
        }
        onType("");
      }}
      onInputChange={(event, value, reason) => {
        if (reason === "input" || reason === "clear") onType(value);
      }}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return (
          <li key={key} {...optionProps}>
            <span>{option.name}</span>
            {Number(option.defaultPrice || 0) > 0 ? <small>{formatPrice(option.defaultPrice)}</small> : null}
          </li>
        );
      }}
      slotProps={{
        paper: {
          sx: {
            mt: 0.5,
            border: "1px solid #dce3ec",
            borderRadius: "6px",
            boxShadow: "0 14px 34px rgba(15, 23, 42, .14)"
          }
        },
        listbox: {
          sx: {
            py: 0.5,
            "& .MuiAutocomplete-option": {
              minHeight: 36,
              px: 1.5,
              py: 0.75,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              fontSize: 13
            },
            "& .MuiAutocomplete-option small": {
              color: "#667085",
              fontSize: 12,
              fontVariantNumeric: "tabular-nums"
            }
          }
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Item name"
          variant="outlined"
          slotProps={{
            ...params.slotProps,
            htmlInput: {
              ...params.slotProps?.htmlInput,
              "aria-label": "Item name"
            }
          }}
        />
      )}
    />
  );
}
