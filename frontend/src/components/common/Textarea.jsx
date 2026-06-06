import TextField from "@mui/material/TextField";
import { cn } from "../../lib/utils.js";

export default function Textarea({ label, error, className = "", helperText, minRows = 2, inputProps, slotProps = {}, ...props }) {
  const { "aria-label": ariaLabel, ...rest } = props;
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
      slotProps={{ ...slotProps, htmlInput: htmlInputSlotProps }}
      {...rest}
    />
  );
}
