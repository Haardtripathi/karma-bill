import { NavLink } from "react-router-dom";
import { FilePlus2, Gauge, Package, ReceiptText, Settings, Users } from "lucide-react";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/company-settings", label: "Company Settings", icon: Settings },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/inventory-items", label: "Inventory Items", icon: Package },
  { to: "/invoices", label: "Invoices", icon: ReceiptText },
  { to: "/invoices/new", label: "Create Invoice", icon: FilePlus2 }
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <span className="brand-mark">KA</span>
        <div>
          <strong>KARMA</strong>
          <span>Automobiles</span>
        </div>
      </div>
      <nav>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "active" : "") }>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
