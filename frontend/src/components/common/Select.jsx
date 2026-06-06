import { Children, isValidElement } from "react";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { cn } from "../../lib/utils.js";

export default function Select({ label, children, error, className = "", helperText, InputLabelProps, SelectProps = {}, inputProps, slotProps = {}, ...props }) {
  const { "aria-label": ariaLabel, ...rest } = props;
  const selectInputProps = {
    ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
    ...inputProps,
    ...SelectProps.inputProps,
    ...slotProps.select?.inputProps
  };
  const inputLabelSlotProps = {
    ...(label ? { shrink: true } : {}),
    ...InputLabelProps,
    ...slotProps.inputLabel
  };
  const menuProps = {
    PaperProps: {
      sx: {
        mt: 0.5,
        border: "1px solid #dce3ec",
        borderRadius: "6px",
        boxShadow: "0 14px 34px rgba(15, 23, 42, .14)",
        "& .MuiMenu-list": { py: 0.5 },
        "& .MuiMenuItem-root": { minHeight: 36, fontSize: 13, px: 1.5, py: 0.75 },
        "& .MuiMenuItem-root.Mui-selected": { bgcolor: "#eff6ff", color: "#1d4ed8" },
        "& .MuiMenuItem-root.Mui-selected:hover": { bgcolor: "#dbeafe" }
      }
    },
    ...SelectProps.MenuProps,
    ...slotProps.select?.MenuProps
  };
  const selectSlotProps = {
    displayEmpty: true,
    ...SelectProps,
    ...slotProps.select,
    inputProps: selectInputProps,
    MenuProps: menuProps
  };
  const items = Children.map(children, (child) => {
    if (!isValidElement(child) || child.type !== "option") return child;
    const optionValue = child.props.value ?? child.props.children ?? "";
    return (
      <MenuItem key={child.key ?? String(optionValue)} value={optionValue} disabled={child.props.disabled}>
        {child.props.children}
      </MenuItem>
    );
  });

  return (
    <TextField
      select
      className={cn("field field-select", className)}
      label={label}
      error={Boolean(error)}
      helperText={error || helperText}
      variant="outlined"
      size="small"
      fullWidth
      slotProps={{ ...slotProps, inputLabel: inputLabelSlotProps, select: selectSlotProps }}
      {...rest}
    >
      {items}
    </TextField>
  );
}
