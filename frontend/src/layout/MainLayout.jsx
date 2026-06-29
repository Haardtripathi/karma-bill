import { Link, Outlet, useLocation } from "react-router-dom";
import { FilePlus2 } from "lucide-react";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

export default function MainLayout() {
  const location = useLocation();
  const showCreateFab = location.pathname !== "/invoices/new";

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        <Outlet />
      </main>
      {showCreateFab && (
        <Link className="mobile-fab" to="/invoices/new" aria-label="Create invoice">
          <FilePlus2 size={20} />
          <span>Invoice</span>
        </Link>
      )}
    </div>
  );
}
