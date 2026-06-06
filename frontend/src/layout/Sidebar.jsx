import { NavLink } from "react-router-dom";
import { FilePlus2, Gauge, Package, ReceiptText, Settings, Users, BarChart2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCompanySettings } from "../api/companySettingApi.js";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/company-settings", label: "Company Settings", icon: Settings },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/inventory-items", label: "Inventory Items", icon: Package },
  { to: "/invoices", label: "Invoices", icon: ReceiptText },
  { to: "/invoices/new", label: "Create Invoice", icon: FilePlus2 },
  { to: "/reports", label: "Reports", icon: BarChart2 }
];

export default function Sidebar() {
  const { data: company } = useQuery({ queryKey: ["company-settings"], queryFn: getCompanySettings });
  const logoUrl = company?.logoUrl || "/logo.webp";

  return (
    <aside className="sidebar">
      <div className="brand-block" style={{ justifyContent: "center", padding: "8px 8px 14px" }}>
        <img 
          src={logoUrl} 
          alt={company?.businessName || "KARMA Automobiles"} 
          style={{ width: "auto", maxWidth: "100%", maxHeight: "45px", objectFit: "contain", display: "block" }} 
        />
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
