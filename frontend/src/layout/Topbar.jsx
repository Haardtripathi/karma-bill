import { CalendarDays } from "lucide-react";

export default function Topbar() {
  return (
    <header className="topbar">
      <div>
        <h1>KARMA AUTOMOBILES Billing</h1>
        <p>Local billing, inventory, PDF and WhatsApp workflow</p>
      </div>
      <div className="today-pill"><CalendarDays size={16} /> {new Date().toLocaleDateString("en-GB")}</div>
    </header>
  );
}
