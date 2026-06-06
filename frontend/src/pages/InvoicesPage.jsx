import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../components/common/Button.jsx";
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
import { cancelInvoice, deleteInvoice, generateInvoicePdf, getInvoices, invoicePdfUrl, sendInvoiceWhatsapp } from "../api/invoiceApi.js";
import { formatCurrency } from "../utils/currency.js";
import { formatDate } from "../utils/date.js";
import { statusClass, statuses } from "../utils/invoiceStatus.js";
import { closePdfPlaceholder, openPdfPlaceholder, openPdfUrl, showPdfUrl } from "../utils/pdfWindow.js";

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);
  const queryClient = useQueryClient();
  const queryKey = ["invoices", debounced, status, fromDate, toDate, page];
  const { data, isLoading } = useQuery({ queryKey, queryFn: () => getInvoices({ search: debounced, status, fromDate, toDate, page, limit: 10 }) });
  const afterAction = (message) => { toast.success(message); queryClient.invalidateQueries({ queryKey: ["invoices"] }); queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }); };
  const cancelMutation = useMutation({ mutationFn: cancelInvoice, onSuccess: () => afterAction("Invoice cancelled"), onError: (error) => toast.error(error.message) });
  const deleteMutation = useMutation({ mutationFn: deleteInvoice, onSuccess: () => afterAction("Invoice deleted"), onError: (error) => toast.error(error.message) });
  const pdfMutation = useMutation({ mutationFn: generateInvoicePdf });
  const whatsappMutation = useMutation({ mutationFn: sendInvoiceWhatsapp, onSuccess: () => afterAction("WhatsApp message sent"), onError: (error) => toast.error(error.message) });

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

  return (
    <section className="page">
      <div className="page-header"><div><h2>Invoices</h2><p>Filter, print, send, cancel and track balances.</p></div><Link className="btn btn-primary" to="/invoices/new">Create Invoice</Link></div>
      <div className="panel page">
        <div className="toolbar-row">
          <SearchBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search invoices" />
          <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All</option>{statuses.map((item) => <option key={item} value={item}>{item}</option>)}</Select>
          <Input label="From date" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          <Input label="To date" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </div>
        {isLoading ? <Loader /> : !data?.items?.length ? <EmptyState title="No invoices found" /> : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Invoice no</th><th>Date</th><th>Customer</th><th>Phone</th><th>Vehicle no</th><th className="amount-heading">Total</th><th className="amount-heading">Received</th><th className="amount-heading">Balance</th><th>Status</th><th>WhatsApp</th><th>Actions</th></tr></thead>
              <tbody>{data.items.map((invoice) => (
                <tr key={invoice._id}>
                  <td><Link to={`/invoices/${invoice._id}`}>{invoice.invoiceCode}</Link></td>
                  <td>{formatDate(invoice.invoiceDate)}</td><td>{invoice.customer?.customerId ? <Link to={`/customers/${invoice.customer.customerId}`}>{invoice.customer.name}</Link> : invoice.customer?.name}</td><td>{invoice.customer?.phone}</td><td>{invoice.customer?.vehicleNumber}</td>
                  <td className="amount-cell">{formatCurrency(invoice.grandTotal)}</td><td className="amount-cell amount-positive">{formatCurrency(invoice.receivedAmount)}</td><td className="amount-cell amount-balance">{formatCurrency(invoice.balanceAmount)}</td><td><span className={statusClass(invoice.status)}>{invoice.status}</span></td>
                  <td>
                    {invoice.whatsapp?.sentCount > 0 ? (
                      <span className={`status-badge whatsapp-badge-${invoice.whatsapp.lastStatus || "queued"}`}>
                        {invoice.whatsapp.lastStatus || "queued"}
                      </span>
                    ) : (
                      <span className="status-badge" style={{ color: "var(--muted)", background: "var(--soft)", borderColor: "var(--line)" }}>Unsent</span>
                    )}
                  </td>
                  <td className="table-actions">
                    <Link className="btn btn-secondary" to={`/invoices/${invoice._id}`}>View</Link>
                    {invoice.status !== "cancelled" && <Link className="btn btn-secondary" to={`/invoices/${invoice._id}/edit`}>Edit</Link>}
                    <PrintButton onClick={() => openPdfUrl(invoicePdfUrl(invoice._id))} />
                    <PdfButton onClick={() => handlePdf(invoice._id)} busy={pdfMutation.isPending} />
                    <WhatsappSendButton onClick={() => whatsappMutation.mutate(invoice._id)} busy={whatsappMutation.isPending} />
                    {invoice.status !== "cancelled" && <Button variant="danger" onClick={() => cancelMutation.mutate(invoice._id)}>Cancel</Button>}
                    <Button variant="ghost" onClick={() => deleteMutation.mutate(invoice._id)}>Delete</Button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <Pagination page={data?.page} pages={data?.pages} onPage={setPage} />
      </div>
    </section>
  );
}
