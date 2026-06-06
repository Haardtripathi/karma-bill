import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { formatCurrency } from "../utils/currency.js";
import { formatDate } from "../utils/date.js";
import Loader from "../components/common/Loader.jsx";
import { getCustomerLedger } from "../api/customerApi.js";

export default function CustomerLedgerPage() {
  const { id } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["customer-ledger", id],
    queryFn: () => getCustomerLedger(id)
  });

  if (isLoading) return <Loader label="Loading ledger..." />;
  if (error) return <div className="panel error">Failed to load ledger: {error.message}</div>;

  const { customer, ledgerSummary, invoices } = data || {};

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Customer Details</h2>
          <p>Detailed view and ledger for {customer?.name}</p>
        </div>
        <div className="actions-row">
          <Link className="btn btn-secondary" to="/customers">Back to Customers</Link>
          <Link className="btn btn-secondary" to={`/customers/${id}/edit`}>Edit Profile</Link>
        </div>
      </div>
      
      <div className="invoice-summary-layout" style={{ marginBottom: "2rem" }}>
        <div className="panel" style={{ margin: 0, padding: "20px" }}>
          <h3 style={{ margin: "0 0 16px 0" }}>Profile Details</h3>
          <div className="form-grid two" style={{ gap: "16px 24px" }}>
            <div>
              <span className="stat-label" style={{ display: "block", fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>Full Name</span>
              <strong style={{ fontSize: "14px" }}>{customer?.name}</strong>
            </div>
            <div>
              <span className="stat-label" style={{ display: "block", fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>Phone</span>
              <strong style={{ fontSize: "14px" }}>{customer?.phone}</strong>
            </div>
            <div>
              <span className="stat-label" style={{ display: "block", fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>Email</span>
              <strong style={{ fontSize: "14px" }}>{customer?.email || "N/A"}</strong>
            </div>
            <div>
              <span className="stat-label" style={{ display: "block", fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>Address</span>
              <strong style={{ fontSize: "14px" }}>{customer?.address || "N/A"}</strong>
            </div>
            <div>
              <span className="stat-label" style={{ display: "block", fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>Vehicle Number</span>
              <strong style={{ fontSize: "14px" }}>{customer?.vehicleNumber || "N/A"}</strong>
            </div>
            <div>
              <span className="stat-label" style={{ display: "block", fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>Last Recorded KM</span>
              <strong style={{ fontSize: "14px" }}>{customer?.vehicleKm || "N/A"}</strong>
            </div>
            <div>
              <span className="stat-label" style={{ display: "block", fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>Status</span>
              <span className={`status-badge ${customer?.isActive ? "paid" : "cancelled"}`} style={{ display: "inline-block", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>
                {customer?.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            {customer?.notes && (
              <div className="span-two">
                <span className="stat-label" style={{ display: "block", fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>Notes</span>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--ink)", whiteSpace: "pre-wrap" }}>{customer.notes}</p>
              </div>
            )}
          </div>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="stat-card" style={{ padding: "16px", background: "#fff", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
            <div className="stat-value" style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--ink)" }}>{formatCurrency(ledgerSummary?.totalBilled || 0)}</div>
            <div className="stat-label" style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, marginTop: "4px" }}>Total Billed</div>
          </div>
          <div className="stat-card" style={{ padding: "16px", background: "#fff", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
            <div className="stat-value" style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--success)" }}>{formatCurrency(ledgerSummary?.totalPaid || 0)}</div>
            <div className="stat-label" style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, marginTop: "4px" }}>Total Paid</div>
          </div>
          <div className="stat-card" style={{ padding: "16px", background: "#fff", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
            <div className="stat-value" style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--danger)" }}>{formatCurrency(ledgerSummary?.outstandingBalance || 0)}</div>
            <div className="stat-label" style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, marginTop: "4px" }}>Outstanding Balance</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3 style={{ marginBottom: "16px" }}>Invoice History</h3>
        {(!invoices || invoices.length === 0) ? (
          <p>No invoices found for this customer.</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice Code</th>
                  <th>Grand Total</th>
                  <th>Received</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv._id}>
                    <td>{formatDate(inv.invoiceDate)}</td>
                    <td><Link to={`/invoices/${inv._id}`}>{inv.invoiceCode}</Link></td>
                    <td>{formatCurrency(inv.grandTotal || 0)}</td>
                    <td>{formatCurrency(inv.receivedAmount || 0)}</td>
                    <td>{formatCurrency(inv.balanceAmount !== undefined ? inv.balanceAmount : (inv.grandTotal || 0) - (inv.receivedAmount || 0))}</td>
                    <td><span className={`status-badge ${inv.status}`}>{inv.status}</span></td>
                    <td>
                      <Link className="btn btn-secondary btn-sm" to={`/invoices/${inv._id}`}>View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
