import { Printer } from "lucide-react";
import Button from "../common/Button.jsx";

export default function PrintButton({ onClick }) {
  return <Button variant="secondary" onClick={onClick}><Printer size={17} /> Print</Button>;
}
