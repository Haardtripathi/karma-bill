import TextField from "@mui/material/TextField";
import { cn } from "../../lib/utils.js";

export default function Input({ label, error, className = "", helperText, InputLabelProps, inputProps, slotProps = {}, min, max, step, pattern, ...props }) {
  const { "aria-label": ariaLabel, ...rest } = props;
  const shrinkDateLabel = rest.type === "date" || rest.type === "time" || rest.type === "datetime-local";
  const nativeInputProps = {
    ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
    ...(step !== undefined ? { step } : {}),
    ...(pattern !== undefined ? { pattern } : {}),
    ...inputProps,
    ...slotProps.htmlInput
  };
  const inputLabelSlotProps = {
    ...(shrinkDateLabel ? { shrink: true } : {}),
    ...InputLabelProps,
    ...slotProps.inputLabel
  };

  return (
    <TextField
      className={cn("field", className)}
      label={label}
      error={Boolean(error)}
      helperText={error || helperText}
      variant="outlined"
      size="small"
      fullWidth
      slotProps={{ ...slotProps, inputLabel: inputLabelSlotProps, htmlInput: nativeInputProps }}
      {...rest}
    />
  );
}
