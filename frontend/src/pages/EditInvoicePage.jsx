import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../components/common/Button.jsx";
import Input from "../components/common/Input.jsx";
import Textarea from "../components/common/Textarea.jsx";
import Loader from "../components/common/Loader.jsx";
import LineItemsTable from "../components/invoice/LineItemsTable.jsx";
import InvoiceTotalsBox from "../components/invoice/InvoiceTotalsBox.jsx";
import PaymentBox from "../components/invoice/PaymentBox.jsx";
import { getInventoryItems } from "../api/inventoryItemApi.js";
import { getInvoice, updateInvoice } from "../api/invoiceApi.js";
import { uploadInvoiceImage } from "../api/uploadApi.js";
import { roundMoney } from "../utils/currency.js";
import { toInputDate } from "../utils/date.js";

export default function EditInvoicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ invoiceDate: toInputDate(), discountAmount: 0, receivedAmount: 0, paymentMode: "Cash", description: "", lineItems: [] });
  const { data: invoice, isLoading } = useQuery({ queryKey: ["invoice", id], queryFn: () => getInvoice(id) });
  const { data: itemsData } = useQuery({ queryKey: ["inventory-items", "invoice-picker"], queryFn: () => getInventoryItems({ limit: 200 }) });
  useEffect(() => {
    if (invoice) setForm({ invoiceDate: toInputDate(invoice.invoiceDate), discountAmount: invoice.discountAmount || 0, receivedAmount: invoice.receivedAmount || 0, paymentMode: invoice.paymentMode || "Cash", description: invoice.description || "", lineItems: invoice.lineItems || [] });
  }, [invoice]);
  const subTotal = useMemo(() => form.lineItems.reduce((sum, item) => sum + roundMoney(Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0), [form.lineItems]);
  const mutation = useMutation({
    mutationFn: () => updateInvoice({ id, payload: { ...form, lineItems: form.lineItems.map((item) => ({ ...item, amount: roundMoney(Number(item.quantity || 0) * Number(item.unitPrice || 0)) })) } }),
    onSuccess: () => { toast.success("Invoice updated"); queryClient.invalidateQueries({ queryKey: ["invoices"] }); navigate(`/invoices/${id}`); },
    onError: (error) => toast.error(error.message)
  });
  const uploadImage = async (file, index) => {
    try {
      const uploaded = await uploadInvoiceImage(file);
      setForm((current) => ({ ...current, lineItems: current.lineItems.map((row, rowIndex) => rowIndex === index ? { ...row, imageUrl: uploaded.url, imagePublicId: uploaded.publicId } : row) }));
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error.message);
    }
  };
  if (isLoading) return <Loader />;
  if (invoice?.status === "cancelled") return <div className="panel">Cancelled invoice cannot be edited.</div>;

  return (
    <section className="page">
      <div className="page-header"><div><h2>Edit Invoice {invoice?.invoiceCode}</h2><p>Invoice number stays unchanged.</p></div><Link className="btn btn-secondary" to={`/invoices/${id}`}>Back</Link></div>
      <div className="panel page">
        <div className="form-grid two"><Input label="Invoice date" type="date" value={form.invoiceDate} onChange={(event) => setForm((current) => ({ ...current, invoiceDate: event.target.value }))} /><Input label="Discount" type="number" min="0" value={form.discountAmount} onChange={(event) => setForm((current) => ({ ...current, discountAmount: event.target.value }))} /></div>
        <LineItemsTable lineItems={form.lineItems} setLineItems={(updater) => setForm((current) => ({ ...current, lineItems: typeof updater === "function" ? updater(current.lineItems) : updater }))} inventoryItems={itemsData?.items || []} onUploadImage={uploadImage} />
        <Textarea label="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
        <PaymentBox paymentMode={form.paymentMode} receivedAmount={form.receivedAmount} onChange={(patch) => setForm((current) => ({ ...current, ...patch }))} />
        <InvoiceTotalsBox subTotal={subTotal} discountAmount={form.discountAmount} receivedAmount={form.receivedAmount} />
        <div className="form-actions"><Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>Save changes</Button></div>
      </div>
    </section>
  );
}
