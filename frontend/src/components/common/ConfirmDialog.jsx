import Modal from "./Modal.jsx";
import Button from "./Button.jsx";

export default function ConfirmDialog({ open, title = "Confirm", message, onCancel, onConfirm, busy }) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p>{message}</p>
      <div className="form-actions right-actions">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>Confirm</Button>
      </div>
    </Modal>
  );
}
