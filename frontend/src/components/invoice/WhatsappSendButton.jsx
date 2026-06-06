import { MessageCircle } from "lucide-react";
import Button from "../common/Button.jsx";

export default function WhatsappSendButton({ onClick, busy }) {
  return <Button variant="success" onClick={onClick} disabled={busy}><MessageCircle size={17} /> WhatsApp</Button>;
}
