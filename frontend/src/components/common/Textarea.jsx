import TextField from "@mui/material/TextField";
import { cn } from "../../lib/utils.js";

export default function Textarea({ label, error, className = "", helperText, minRows = 2, inputProps, slotProps = {}, onFocus, ...props }) {
  const { "aria-label": ariaLabel, ...rest } = props;

  const handleFocus = (event) => {
    const target = event.target;
    if (target) {
      setTimeout(() => {
        try {
          target.setSelectionRange(target.value.length, target.value.length);
        } catch (e) {
          // ignore
        }
      }, 0);
    }
    if (onFocus) {
      onFocus(event);
    }
  };

  const htmlInputSlotProps = {
    ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
    ...inputProps,
    ...slotProps.htmlInput
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
      multiline
      minRows={minRows}
      onFocus={handleFocus}
      slotProps={{ ...slotProps, htmlInput: htmlInputSlotProps }}
      {...rest}
    />
  );
}
