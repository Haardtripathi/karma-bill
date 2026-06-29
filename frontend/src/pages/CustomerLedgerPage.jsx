import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { formatCurrency } from "../utils/currency.js";
import { formatDate } from "../utils/date.js";
import Loader from "../components/common/Loader.jsx";
import { getCustomerLedger } from "../api/customerApi.js";
import { statusClass } from "../utils/invoiceStatus.js";

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
      
      <div className="customer-ledger-layout">
        <div className="panel customer-profile-card">
          <h3>Profile Details</h3>
          <div className="form-grid two profile-detail-grid">
            <div className="profile-detail">
              <span>Full Name</span>
              <strong>{customer?.name}</strong>
            </div>
            <div className="profile-detail">
              <span>Phone</span>
              <strong>{customer?.phone}</strong>
            </div>
            <div className="profile-detail">
              <span>Email</span>
              <strong>{customer?.email || "N/A"}</strong>
            </div>
            <div className="profile-detail">
              <span>Address</span>
              <strong>{customer?.address || "N/A"}</strong>
            </div>
            <div className="profile-detail">
              <span>Vehicle Number</span>
              <strong>{customer?.vehicleNumber || "N/A"}</strong>
            </div>
            <div className="profile-detail">
              <span>Last Recorded KM</span>
              <strong>{customer?.vehicleKm || "N/A"}</strong>
            </div>
            <div className="profile-detail">
              <span>Status</span>
              <span className={`status-badge ${customer?.isActive ? "status-paid" : "status-cancelled"}`}>
                {customer?.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            {customer?.notes && (
              <div className="span-two profile-detail">
                <span>Notes</span>
                <p>{customer.notes}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="ledger-summary-stack">
          <div className="ledger-summary-card">
            <strong>{formatCurrency(ledgerSummary?.totalBilled || 0)}</strong>
            <span>Total Billed</span>
          </div>
          <div className="ledger-summary-card ledger-summary-paid">
            <strong>{formatCurrency(ledgerSummary?.totalPaid || 0)}</strong>
            <span>Total Paid</span>
          </div>
          <div className="ledger-summary-card ledger-summary-due">
            <strong>{formatCurrency(ledgerSummary?.outstandingBalance || 0)}</strong>
            <span>Outstanding Balance</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">Invoice History</h3>
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
                    <td data-label="Date">{formatDate(inv.invoiceDate)}</td>
                    <td data-label="Invoice"><Link to={`/invoices/${inv._id}`}>{inv.invoiceCode}</Link></td>
                    <td className="amount-cell" data-label="Grand total">{formatCurrency(inv.grandTotal || 0)}</td>
                    <td className="amount-cell amount-positive" data-label="Received">{formatCurrency(inv.receivedAmount || 0)}</td>
                    <td className="amount-cell amount-balance" data-label="Balance">{formatCurrency(inv.balanceAmount !== undefined ? inv.balanceAmount : (inv.grandTotal || 0) - (inv.receivedAmount || 0))}</td>
                    <td data-label="Status"><span className={statusClass(inv.status)}>{inv.status}</span></td>
                    <td className="table-actions" data-label="Action">
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
