import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../layout/MainLayout.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import CompanySettingsPage from "../pages/CompanySettingsPage.jsx";
import CustomersPage from "../pages/CustomersPage.jsx";
import CustomerFormPage from "../pages/CustomerFormPage.jsx";
import InventoryItemsPage from "../pages/InventoryItemsPage.jsx";
import InventoryItemFormPage from "../pages/InventoryItemFormPage.jsx";
import InvoicesPage from "../pages/InvoicesPage.jsx";
import CreateInvoicePage from "../pages/CreateInvoicePage.jsx";
import EditInvoicePage from "../pages/EditInvoicePage.jsx";
import InvoiceDetailsPage from "../pages/InvoiceDetailsPage.jsx";
import InvoicePrintPage from "../pages/InvoicePrintPage.jsx";

import CustomerLedgerPage from "../pages/CustomerLedgerPage.jsx";

import ReportsPage from "../pages/ReportsPage.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/invoices/:id/print" element={<InvoicePrintPage />} />
      <Route element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/company-settings" element={<CompanySettingsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/new" element={<CustomerFormPage />} />
        <Route path="/customers/:id/edit" element={<CustomerFormPage />} />
        <Route path="/customers/:id" element={<CustomerLedgerPage />} />
        <Route path="/customers/:id/ledger" element={<CustomerLedgerPage />} />
        <Route path="/inventory-items" element={<InventoryItemsPage />} />
        <Route path="/inventory-items/new" element={<InventoryItemFormPage />} />
        <Route path="/inventory-items/:id/edit" element={<InventoryItemFormPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/invoices/new" element={<CreateInvoicePage />} />
        <Route path="/invoices/:id" element={<InvoiceDetailsPage />} />
        <Route path="/invoices/:id/edit" element={<EditInvoicePage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}
