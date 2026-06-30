import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../components/common/Button.jsx";
import Input from "../components/common/Input.jsx";
import Modal from "../components/common/Modal.jsx";
import Select from "../components/common/Select.jsx";
import Textarea from "../components/common/Textarea.jsx";
import Loader from "../components/common/Loader.jsx";
import InvoiceTemplate from "../components/invoice/InvoiceTemplate.jsx";
import PrintButton from "../components/invoice/PrintButton.jsx";
import PdfButton from "../components/invoice/PdfButton.jsx";
import WhatsappSendButton from "../components/invoice/WhatsappSendButton.jsx";
import { addInvoicePayment, cancelInvoice, generateInvoicePdf, getInvoicePrintData, invoicePdfUrl, sendInvoiceWhatsapp } from "../api/invoiceApi.js";
import { formatDate, formatDateTime, toInputDate } from "../utils/date.js";
import { formatCurrency } from "../utils/currency.js";
import { statusClass } from "../utils/invoiceStatus.js";
import { closePdfPlaceholder, openPdfPlaceholder, openPdfUrl, showPdfUrl } from "../utils/pdfWindow.js";
import { openWhatsappPlaceholder, closeWhatsappPlaceholder } from "../utils/whatsappWindow.js";
import { getWhatsappShareSuccessMessage, shareInvoiceWhatsappResult } from "../utils/invoiceWhatsappShare.js";
import { CalendarDays, CarFront, IndianRupee, MessageCircle, ReceiptText, UserRound, WalletCards } from "lucide-react";

const displayValue = (value) => value || "Not added";

function InvoiceMetricCard({ label, value, tone = "", icon: Icon }) {
  return (
    <div className={`invoice-metric-card ${tone ? `invoice-metric-${tone}` : ""}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      {Icon && <Icon size={18} />}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="invoice-detail-item">
      <span>{label}</span>
      <strong>{displayValue(value)}</strong>
    </div>
  );
}

function DetailBox({ title, icon: Icon, children }) {
  return (
    <div className="invoice-detail-box-card">
      <div className="invoice-detail-box-head">
        {Icon && <Icon size={17} />}
        <h3>{title}</h3>
      </div>
      <div className="invoice-detail-list">{children}</div>
    </div>
  );
}

export default function InvoiceDetailsPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payment, setPayment] = useState({ amount: "", mode: "Cash", paymentDate: toInputDate(), note: "" });
  const { data, isLoading } = useQuery({ queryKey: ["invoice-print-data", id], queryFn: () => getInvoicePrintData(id) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["invoice-print-data", id] });
  const pdfMutation = useMutation({ mutationFn: () => generateInvoicePdf(id) });
  const whatsappMutation = useMutation({ mutationFn: () => sendInvoiceWhatsapp(id) });
  const cancelMutation = useMutation({ mutationFn: () => cancelInvoice(id), onSuccess: () => { toast.success("Invoice cancelled"); refresh(); }, onError: (error) => toast.error(error.message) });
  const paymentMutation = useMutation({ mutationFn: () => addInvoicePayment({ id, payload: { ...payment, amount: Number(payment.amount || 0) } }), onSuccess: () => { toast.success("Payment added"); setPaymentOpen(false); refresh(); }, onError: (error) => toast.error(error.message) });

  const handlePdf = () => {
    const popup = openPdfPlaceholder();
    pdfMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("PDF generated");
        refresh();
        showPdfUrl(popup, invoicePdfUrl(id));
      },
      onError: (error) => {
        closePdfPlaceholder(popup);
        toast.error(error.message);
      }
    });
  };

  const handleWhatsapp = () => {
    const popup = openWhatsappPlaceholder();
    whatsappMutation.mutate(undefined, {
      onSuccess: async (result) => {
        try {
          const shareResult = await shareInvoiceWhatsappResult({ result, invoiceId: id, invoice, popup });
          if (shareResult.action === "cancelled") return;
          if (shareResult.action === "shared") {
            toast.success(getWhatsappShareSuccessMessage(shareResult));
          }
          if (shareResult.action === "opened") toast.success("WhatsApp opened (text only)");
          if (shareResult.action === "sent") toast.success("WhatsApp message sent");
          refresh();
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

  if (isLoading) return <Loader label="Loading invoice..." />;
  const { invoice, company } = data || {};
  const isCancelled = invoice?.status === "cancelled";
  const lineItemCount = invoice?.lineItems?.length || 0;

  return (
    <section className="page">
      <div className="page-header no-print">
        <div>
          <h2>{invoice?.invoiceCode}</h2>
          <p>Invoice workspace with customer, payment and delivery context.</p>
        </div>
        <div className="actions-row">
          <Link className="btn btn-secondary" to="/invoices">Back</Link>
          {!isCancelled && <Link className="btn btn-secondary" to={`/invoices/${id}/edit`}>Edit</Link>}
        </div>
      </div>

      <div className="invoice-workspace no-print">
        <div className="panel invoice-hero-panel">
          <div className="invoice-hero-main">
            <span className={statusClass(invoice?.status)}>{invoice?.status}</span>
            <h3>{invoice?.customer?.name || "Walk-in customer"}</h3>
            <p>{displayValue(invoice?.customer?.phone)}{invoice?.customer?.vehicleNumber ? ` - ${invoice.customer.vehicleNumber}` : ""}</p>
          </div>
          <div className="invoice-hero-amount">
            <span>Balance due</span>
            <strong>{formatCurrency(invoice?.balanceAmount)}</strong>
            <small>{formatDate(invoice?.invoiceDate)}</small>
          </div>
        </div>

        <div className="invoice-metric-grid">
          <InvoiceMetricCard label="Invoice Total" value={formatCurrency(invoice?.grandTotal)} icon={IndianRupee} />
          <InvoiceMetricCard label="Received" value={formatCurrency(invoice?.receivedAmount)} tone="success" icon={WalletCards} />
          <InvoiceMetricCard label="Balance" value={formatCurrency(invoice?.balanceAmount)} tone="danger" icon={ReceiptText} />
          <InvoiceMetricCard label="Line Items" value={lineItemCount} icon={ReceiptText} />
        </div>

        <div className="invoice-info-grid">
          <DetailBox title="Customer" icon={UserRound}>
            <DetailRow label="Name" value={invoice?.customer?.name} />
            <DetailRow label="Phone" value={invoice?.customer?.phone} />
            <DetailRow label="Address" value={invoice?.customer?.address} />
          </DetailBox>
          <DetailBox title="Vehicle" icon={CarFront}>
            <DetailRow label="Vehicle no" value={invoice?.customer?.vehicleNumber} />
            <DetailRow label="KM" value={invoice?.customer?.vehicleKm} />
            <DetailRow label="Car" value={[invoice?.carBrand, invoice?.carName].filter(Boolean).join(" ")} />
            <DetailRow label="Fuel" value={invoice?.fuelType} />
          </DetailBox>
          <DetailBox title="Dates & Payment" icon={CalendarDays}>
            <DetailRow label="Invoice date" value={formatDateTime(invoice?.invoiceDate)} />
            <DetailRow label="Delivery date" value={formatDateTime(invoice?.deliveryDate)} />
            <DetailRow label="Payment mode" value={invoice?.paymentMode} />
            <DetailRow label="Last PDF" value={formatDateTime(invoice?.lastPdfGeneratedAt)} />
          </DetailBox>
        </div>

        <div className="panel invoice-action-panel">
          <div className="invoice-action-copy">
            <strong>Quick Actions</strong>
            <span>Print, generate PDF, send on WhatsApp, or record payment.</span>
          </div>
          <div className="actions-row invoice-action-buttons">
            <PrintButton onClick={() => openPdfUrl(invoicePdfUrl(id))} />
            <PdfButton onClick={handlePdf} busy={pdfMutation.isPending} />
            <WhatsappSendButton onClick={handleWhatsapp} busy={whatsappMutation.isPending} />
            {!isCancelled && (
              <>
                <Button variant="secondary" onClick={() => setPaymentOpen(true)}>Add payment</Button>
                <Button variant="danger" onClick={() => cancelMutation.mutate()}>Cancel invoice</Button>
              </>
            )}
            <a className="btn btn-secondary" href={invoicePdfUrl(id)} target="_blank" rel="noreferrer">Open PDF</a>
          </div>
        </div>
      </div>

      {invoice?.whatsapp?.sentCount > 0 && (
        <div className={`panel whatsapp-status-card status-${invoice.whatsapp.lastStatus || "queued"} no-print`}>
          <div className="status-header">
            <div className="status-title-row">
              <span className="whatsapp-icon"><MessageCircle size={17} /></span>
              <strong>WhatsApp Delivery Status</strong>
              <span className={`status-badge whatsapp-badge-${invoice.whatsapp.lastStatus || "queued"}`}>
                {invoice.whatsapp.lastStatus || "queued"}
              </span>
            </div>
            <span className="status-time">
              Last Sent: {new Date(invoice.whatsapp.lastSentAt).toLocaleString()} ({invoice.whatsapp.sentCount} message{invoice.whatsapp.sentCount > 1 ? "s" : ""} sent)
            </span>
          </div>
          {invoice.whatsapp.lastError && (
            <div className="status-error">
              <strong>Delivery Error:</strong> {invoice.whatsapp.lastError}
            </div>
          )}
        </div>
      )}
      <div className="invoice-preview-shell">
        <div className="invoice-preview-heading no-print">
          <div>
            <h3>Printable Invoice</h3>
            <p>This is the customer-facing PDF/print layout.</p>
          </div>
        </div>
        <InvoiceTemplate invoice={invoice} company={company} />
      </div>
      <Modal open={paymentOpen} title="Add payment" onClose={() => setPaymentOpen(false)}>
        <div className="form-grid two">
          <Input label="Amount" type="number" min="0" value={payment.amount} onChange={(event) => setPayment((current) => ({ ...current, amount: event.target.value }))} />
          <Select label="Mode" value={payment.mode} onChange={(event) => setPayment((current) => ({ ...current, mode: event.target.value }))}>{['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'Other'].map((mode) => <option key={mode}>{mode}</option>)}</Select>
          <Input label="Date" type="date" value={payment.paymentDate} onChange={(event) => setPayment((current) => ({ ...current, paymentDate: event.target.value }))} />
          <Textarea label="Note" value={payment.note} onChange={(event) => setPayment((current) => ({ ...current, note: event.target.value }))} />
        </div>
        <div className="form-actions right-actions"><Button onClick={() => paymentMutation.mutate()} disabled={paymentMutation.isPending}>Save payment</Button></div>
      </Modal>
    </section>
  );
}
