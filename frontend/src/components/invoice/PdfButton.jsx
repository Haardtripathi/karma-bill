import { FileDown } from "lucide-react";
import Button from "../common/Button.jsx";

export default function PdfButton({ onClick, busy }) {
  return <Button variant="secondary" onClick={onClick} disabled={busy}><FileDown size={17} /> PDF</Button>;
}
