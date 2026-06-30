import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../components/common/Button.jsx";
import CollapsiblePanel from "../components/common/CollapsiblePanel.jsx";
import Input from "../components/common/Input.jsx";
import Select from "../components/common/Select.jsx";
import SearchBar from "../components/common/SearchBar.jsx";
import Loader from "../components/common/Loader.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import Pagination from "../components/common/Pagination.jsx";
import PdfButton from "../components/invoice/PdfButton.jsx";
import PrintButton from "../components/invoice/PrintButton.jsx";
import WhatsappSendButton from "../components/invoice/WhatsappSendButton.jsx";
import useDebounce from "../hooks/useDebounce.js";
import useIsMobile from "../hooks/useIsMobile.js";
import { cancelInvoice, deleteInvoice, generateInvoicePdf, getInvoices, invoicePdfUrl, sendInvoiceWhatsapp } from "../api/invoiceApi.js";
import { formatCurrency } from "../utils/currency.js";
import { formatDate } from "../utils/date.js";
import { statusClass, statuses } from "../utils/invoiceStatus.js";
import { closePdfPlaceholder, openPdfPlaceholder, openPdfUrl, showPdfUrl } from "../utils/pdfWindow.js";
import { openWhatsappPlaceholder, closeWhatsappPlaceholder } from "../utils/whatsappWindow.js";
import { getWhatsappShareSuccessMessage, shareInvoiceWhatsappResult } from "../utils/invoiceWhatsappShare.js";

export default function InvoicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(statuses.includes(initialStatus) ? initialStatus : "");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const queryKey = ["invoices", debounced, status, fromDate, toDate, page];
  const { data, isLoading, isFetching, refetch } = useQuery({ queryKey, queryFn: () => getInvoices({ search: debounced, status, fromDate, toDate, page, limit: 10 }) });
  const refreshInvoiceData = () => {
    queryClient.invalidateQueries({ queryKey: ["invoices"], refetchType: "none" });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    return refetch();
  };
  const afterAction = (message) => { toast.success(message); refreshInvoiceData(); };
  const cancelMutation = useMutation({ mutationFn: cancelInvoice, onSuccess: () => afterAction("Invoice cancelled"), onError: (error) => toast.error(error.message) });
  const deleteMutation = useMutation({ mutationFn: deleteInvoice, onSuccess: () => afterAction("Invoice deleted"), onError: (error) => toast.error(error.message) });
  const pdfMutation = useMutation({ mutationFn: generateInvoicePdf });
  const whatsappMutation = useMutation({ mutationFn: sendInvoiceWhatsapp });

  const handlePdf = (invoiceId) => {
    const popup = openPdfPlaceholder();
    pdfMutation.mutate(invoiceId, {
      onSuccess: () => {
        afterAction("PDF generated");
        showPdfUrl(popup, invoicePdfUrl(invoiceId));
      },
      onError: (error) => {
        closePdfPlaceholder(popup);
        toast.error(error.message);
      }
    });
  };

  const handleWhatsapp = (invoice) => {
    const popup = openWhatsappPlaceholder();
    whatsappMutation.mutate(invoice._id, {
      onSuccess: async (result) => {
        try {
          const shareResult = await shareInvoiceWhatsappResult({ result, invoiceId: invoice._id, invoice, popup });
          if (shareResult.action === "cancelled") return;
          if (shareResult.action === "shared") {
            toast.success(getWhatsappShareSuccessMessage(shareResult));
          }
          if (shareResult.action === "opened") toast.success("WhatsApp opened (text only)");
          if (shareResult.action === "sent") toast.success("WhatsApp message sent");
          refreshInvoiceData();
        } catch (error) {
          closeWhatsappPlaceholder(popup);
          toast.error(error.message || "Share failed");
        }
      },
      onError: (error) => {
        closeWhatsappPlaceholder(popup);
        toast.error(error.message);
      }
    });
  };
  const updateStatus = (nextStatus) => {
    setStatus(nextStatus);
    setPage(1);
    const nextParams = new URLSearchParams(searchParams);
    if (nextStatus) nextParams.set("status", nextStatus);
    else nextParams.delete("status");
    setSearchParams(nextParams, { replace: true });
  };
  const handleManualRefresh = async () => {
    await refreshInvoiceData();
    toast.success("Invoices reloaded");
  };
  const activeFilterCount = [search, status, fromDate, toDate].filter(Boolean).length;
  const resultSummary = data?.total !== undefined ? `${data.total} invoice${data.total === 1 ? "" : "s"}` : "Invoices";
  const renderInvoiceActions = (invoice) => (
    <>
      <Link className="btn btn-secondary" to={`/invoices/${invoice._id}`}>View</Link>
      {invoice.status !== "cancelled" && <Link className="btn btn-secondary" to={`/invoices/${invoice._id}/edit`}>Edit</Link>}
      <PrintButton onClick={() => openPdfUrl(invoicePdfUrl(invoice._id))} />
      <PdfButton onClick={() => handlePdf(invoice._id)} busy={pdfMutation.isPending && pdfMutation.variables === invoice._id} />
      <WhatsappSendButton onClick={() => handleWhatsapp(invoice)} busy={whatsappMutation.isPending && whatsappMutation.variables === invoice._id} />
      {invoice.status !== "cancelled" && <Button variant="danger" onClick={() => cancelMutation.mutate(invoice._id)} disabled={cancelMutation.isPending && cancelMutation.variables === invoice._id}>Cancel</Button>}
      <Button variant="ghost" onClick={() => deleteMutation.mutate(invoice._id)} disabled={deleteMutation.isPending && deleteMutation.variables === invoice._id}>Delete</Button>
    </>
  );
  const renderWhatsappStatus = (invoice) => invoice.whatsapp?.sentCount > 0 ? (
    <span className={`status-badge whatsapp-badge-${invoice.whatsapp.lastStatus || "queued"}`}>
      {invoice.whatsapp.lastStatus || "queued"}
    </span>
  ) : (
    <span className="status-badge status-muted">Unsent</span>
  );

  return (
    <section className="page">
      <div className="page-header"><div><h2>Invoices</h2><p>Filter, print, send, cancel and track balances.</p></div><Link className="btn btn-primary" to="/invoices/new">Create Invoice</Link></div>
      <CollapsiblePanel title="Filters" summary={activeFilterCount ? `${activeFilterCount} active` : "All invoices"} defaultOpen={!isMobile}>
        <div className="toolbar-row">
          <SearchBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search invoices" />
          <Select label="Status" value={status} onChange={(event) => updateStatus(event.target.value)}><option value="">All</option>{statuses.map((item) => <option key={item} value={item}>{item}</option>)}</Select>
          <Input label="From date" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          <Input label="To date" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </div>
      </CollapsiblePanel>
      <div className="panel page record-list-panel">
        <div className="section-heading record-list-heading">
          <div>
            <h2>Invoice List</h2>
            <p>{isFetching && data ? "Updating..." : resultSummary}</p>
          </div>
          <Button variant="secondary" onClick={handleManualRefresh} disabled={isFetching}><RefreshCw size={15} />{isFetching ? "Reloading" : "Reload"}</Button>
        </div>
        {isLoading ? <Loader /> : !data?.items?.length ? <EmptyState title="No invoices found" /> : (
          isMobile ? (
            <div className="record-accordion-list">
              {data.items.map((invoice) => (
                <details className="record-accordion" key={invoice._id}>
                  <summary className="record-summary">
                    <span className="record-summary-main">
                      <span className="record-title-row">
                        <span className="record-title">{invoice.invoiceCode}</span>
                        <span className={statusClass(invoice.status)}>{invoice.status}</span>
                      </span>
                      <span className="record-subtitle">{invoice.customer?.name || "Walk-in customer"} · {formatDate(invoice.invoiceDate)}</span>
                    </span>
                    <span className="record-summary-side">
                      <strong>{formatCurrency(invoice.balanceAmount)}</strong>
                      <span>Balance</span>
                    </span>
                    <ChevronDown className="record-chevron" size={16} aria-hidden="true" />
                  </summary>
                  <div className="record-details">
                    <div className="record-detail-grid">
                      <div className="record-detail"><span>Customer</span><strong>{invoice.customer?.customerId ? <Link to={`/customers/${invoice.customer.customerId}`}>{invoice.customer.name}</Link> : invoice.customer?.name}</strong></div>
                      <div className="record-detail"><span>Phone</span><strong>{invoice.customer?.phone || "-"}</strong></div>
                      <div className="record-detail"><span>Vehicle</span><strong>{invoice.customer?.vehicleNumber || "-"}</strong></div>
                      <div className="record-detail"><span>Total</span><strong>{formatCurrency(invoice.grandTotal)}</strong></div>
                      <div className="record-detail"><span>Received</span><strong className="amount-positive">{formatCurrency(invoice.receivedAmount)}</strong></div>
                      <div className="record-detail"><span>WhatsApp</span><strong>{renderWhatsappStatus(invoice)}</strong></div>
                    </div>
                    <div className="record-actions">
                      {renderInvoiceActions(invoice)}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          ) : (
          <div className="table-scroll desktop-record-table">
            <table className="data-table">
              <thead><tr><th>Invoice no</th><th>Date</th><th>Customer</th><th>Phone</th><th>Vehicle no</th><th className="amount-heading">Total</th><th className="amount-heading">Received</th><th className="amount-heading">Balance</th><th>Status</th><th>WhatsApp</th><th>Actions</th></tr></thead>
              <tbody>{data.items.map((invoice) => (
                <tr key={invoice._id}>
                  <td data-label="Invoice"><Link to={`/invoices/${invoice._id}`}>{invoice.invoiceCode}</Link></td>
                  <td data-label="Date">{formatDate(invoice.invoiceDate)}</td>
                  <td data-label="Customer">{invoice.customer?.customerId ? <Link to={`/customers/${invoice.customer.customerId}`}>{invoice.customer.name}</Link> : invoice.customer?.name}</td>
                  <td data-label="Phone">{invoice.customer?.phone}</td>
                  <td data-label="Vehicle">{invoice.customer?.vehicleNumber}</td>
                  <td className="amount-cell" data-label="Total">{formatCurrency(invoice.grandTotal)}</td>
                  <td className="amount-cell amount-positive" data-label="Received">{formatCurrency(invoice.receivedAmount)}</td>
                  <td className="amount-cell amount-balance" data-label="Balance">{formatCurrency(invoice.balanceAmount)}</td>
                  <td data-label="Status"><span className={statusClass(invoice.status)}>{invoice.status}</span></td>
                  <td data-label="WhatsApp">
                    {renderWhatsappStatus(invoice)}
                  </td>
                  <td className="table-actions" data-label="Actions">
                    {renderInvoiceActions(invoice)}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          )
        )}
        <Pagination page={data?.page} pages={data?.pages} onPage={setPage} />
      </div>
    </section>
  );
}
