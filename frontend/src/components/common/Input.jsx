import TextField from "@mui/material/TextField";
import { cn } from "../../lib/utils.js";

export default function Input({ label, error, className = "", helperText, InputLabelProps, inputProps, slotProps = {}, min, max, step, pattern, onFocus, ...props }) {
  const { "aria-label": ariaLabel, ...rest } = props;
  const shrinkDateLabel = rest.type === "date" || rest.type === "time" || rest.type === "datetime-local";

  const handleFocus = (event) => {
    const target = event.target;
    if (target) {
      setTimeout(() => {
        try {
          if (target.type === "number") {
            const val = target.value;
            target.type = "text";
            target.setSelectionRange(val.length, val.length);
            target.type = "number";
          } else {
            target.setSelectionRange(target.value.length, target.value.length);
          }
        } catch (e) {
          // ignore
        }
      }, 0);
    }
    if (onFocus) {
      onFocus(event);
    }
  };

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
      onFocus={handleFocus}
      slotProps={{ ...slotProps, inputLabel: inputLabelSlotProps, htmlInput: nativeInputProps }}
      {...rest}
    />
  );
}
