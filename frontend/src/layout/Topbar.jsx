import { Link } from "react-router-dom";
import { CalendarDays, Settings } from "lucide-react";

export default function Topbar() {
  return (
    <header className="topbar">
      <div>
        <h1>KARMA AUTOMOBILES Billing</h1>
        <p>Local billing, inventory, PDF and WhatsApp workflow</p>
      </div>
      <div className="topbar-actions">
        <Link className="topbar-icon-btn" to="/company-settings" aria-label="Company settings" title="Company settings">
          <Settings size={17} />
        </Link>
        <div className="today-pill"><CalendarDays size={16} /> {new Date().toLocaleDateString("en-GB")}</div>
      </div>
    </header>
  );
}
