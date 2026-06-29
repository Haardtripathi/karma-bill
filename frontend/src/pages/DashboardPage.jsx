import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarDays, CheckCircle2, CircleAlert, Clock3, FilePlus2, IndianRupee, PencilLine, ReceiptText, WalletCards } from "lucide-react";
import StatCard from "../components/common/StatCard.jsx";
import Loader from "../components/common/Loader.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import DateRangeFilter, { getDateRangeLabel } from "../components/common/DateRangeFilter.jsx";
import WhatsappSendButton from "../components/invoice/WhatsappSendButton.jsx";
import PrintButton from "../components/invoice/PrintButton.jsx";
import { getDashboardSummary } from "../api/dashboardApi.js";
import { invoicePdfUrl, sendInvoiceWhatsapp } from "../api/invoiceApi.js";
import { formatCurrency } from "../utils/currency.js";
import { formatDate } from "../utils/date.js";
import { statusClass } from "../utils/invoiceStatus.js";
import toast from "react-hot-toast";
import { openPdfUrl } from "../utils/pdfWindow.js";
import { openWhatsappPlaceholder, closeWhatsappPlaceholder } from "../utils/whatsappWindow.js";
import { shareInvoiceWhatsappResult } from "../utils/invoiceWhatsappShare.js";

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [loadingInvoiceId, setLoadingInvoiceId] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-summary", dateRange.startDate, dateRange.endDate],
    queryFn: () => getDashboardSummary(dateRange)
  });
  if (isLoading) return <Loader label="Loading dashboard..." />;
  const summary = data || {};
  const recent = summary.recentInvoices || [];
  const activeRangeLabel = getDateRangeLabel(dateRange.startDate, dateRange.endDate);

  const sendWhatsapp = async (invoice) => {
    const id = invoice._id;
    const popup = openWhatsappPlaceholder();
    setLoadingInvoiceId(id);
    try {
      const result = await sendInvoiceWhatsapp(id);
      const shareResult = await shareInvoiceWhatsappResult({ result, invoiceId: id, invoice, popup });
      if (shareResult.action === "cancelled") return;
      if (shareResult.action === "shared") toast.success("Invoice PDF shared");
      if (shareResult.action === "opened") toast.success("WhatsApp opened (text only)");
      if (shareResult.action === "sent") toast.success("WhatsApp message sent");
    } catch (error) {
      closeWhatsappPlaceholder(popup);
      toast.error(error.message || "Share failed");
    } finally {
      setLoadingInvoiceId(null);
    }
  };


  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Confirmed billing, receivables, drafts and recent transactions.</p>
        </div>
        <div className="actions-row">
          <DateRangeFilter label="Dashboard range" startDate={dateRange.startDate} endDate={dateRange.endDate} onChange={setDateRange} compact />
          <Link className="btn btn-primary" to="/invoices/new"><FilePlus2 size={17} /> Create Invoice</Link>
        </div>
      </div>
      <div className="stat-grid">
        <StatCard icon={ReceiptText} label="Total invoices" value={summary.totalInvoices || 0} detail="Includes drafts" />
        <StatCard icon={CalendarDays} label="Today invoices" value={summary.todayInvoices || 0} />
        <StatCard icon={CheckCircle2} label="Confirmed invoices" value={summary.confirmedInvoices || 0} tone="success" detail="Paid, partial and unpaid" />
        <StatCard icon={PencilLine} label="Draft invoices" value={summary.draftInvoices || 0} tone="info" />
        <StatCard icon={IndianRupee} label="Confirmed sales" value={formatCurrency(summary.totalSales)} tone="success" detail="Draft/cancelled excluded" />
        <StatCard icon={WalletCards} label="Total received" value={formatCurrency(summary.totalReceived)} tone="success" />
        <StatCard icon={CircleAlert} label="Total balance" value={formatCurrency(summary.totalBalance)} tone="danger" />
        <StatCard icon={PencilLine} label="Draft amount" value={formatCurrency(summary.draftAmount)} tone="info" detail="Not counted as sales" />
        <StatCard icon={CheckCircle2} label="Paid invoices" value={summary.paidInvoices || 0} tone="success" />
        <StatCard icon={Clock3} label="Partial invoices" value={summary.partialInvoices || 0} tone="warning" />
        <StatCard icon={CircleAlert} label="Unpaid invoices" value={summary.unpaidInvoices || 0} tone="danger" />
      </div>
      <div className="panel">
        <div className="section-heading"><div><h2>Recent invoices</h2><p>{activeRangeLabel}</p></div><Link to="/invoices">View all</Link></div>
        {!recent.length ? <EmptyState title="No recent invoices" /> : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Invoice code</th><th>Date</th><th>Customer</th><th className="amount-heading">Amount</th><th className="amount-heading">Received</th><th className="amount-heading">Balance</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {recent.map((invoice) => (
                  <tr key={invoice._id}>
                    <td data-label="Invoice"><Link to={`/invoices/${invoice._id}`}>{invoice.invoiceCode}</Link></td>
                    <td data-label="Date">{formatDate(invoice.invoiceDate)}</td>
                    <td data-label="Customer">{invoice.customer?.customerId ? <Link to={`/customers/${invoice.customer.customerId}`}>{invoice.customer.name}</Link> : invoice.customer?.name}</td>
                    <td className="amount-cell" data-label="Amount">{formatCurrency(invoice.grandTotal)}</td>
                    <td className="amount-cell amount-positive" data-label="Received">{formatCurrency(invoice.receivedAmount)}</td>
                    <td className="amount-cell amount-balance" data-label="Balance">{formatCurrency(invoice.balanceAmount)}</td>
                    <td data-label="Status"><span className={statusClass(invoice.status)}>{invoice.status}</span></td>
                    <td className="table-actions" data-label="Actions">
                      <Link className="btn btn-secondary" to={`/invoices/${invoice._id}`}>View</Link>
                      <PrintButton onClick={() => openPdfUrl(invoicePdfUrl(invoice._id))} />
                      <WhatsappSendButton onClick={() => sendWhatsapp(invoice)} busy={loadingInvoiceId === invoice._id} />
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
