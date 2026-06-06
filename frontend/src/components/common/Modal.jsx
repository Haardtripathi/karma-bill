import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import { X } from "lucide-react";

export default function Modal({ open, title, children, onClose }) {
  return (
    <Dialog open={Boolean(open)} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ className: "modal-panel" }}>
      <DialogTitle className="modal-header">
        <span>{title}</span>
        <IconButton aria-label="Close" onClick={onClose} size="small"><X size={18} /></IconButton>
      </DialogTitle>
      <DialogContent className="modal-content">{children}</DialogContent>
    </Dialog>
  );
}
