import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../components/common/Button.jsx";
import Input from "../components/common/Input.jsx";
import Textarea from "../components/common/Textarea.jsx";
import Loader from "../components/common/Loader.jsx";
import CustomerPicker from "../components/invoice/CustomerPicker.jsx";
import DateTimeFields, { defaultTimeParts } from "../components/invoice/DateTimeFields.jsx";
import LineItemsTable from "../components/invoice/LineItemsTable.jsx";
import InvoiceTotalsBox from "../components/invoice/InvoiceTotalsBox.jsx";
import PaymentBox from "../components/invoice/PaymentBox.jsx";
import VehicleDetailsFields, { emptyVehicleDetails } from "../components/invoice/VehicleDetailsFields.jsx";
import { getCustomers } from "../api/customerApi.js";
import { getInventoryItems } from "../api/inventoryItemApi.js";
import { getInvoice, updateInvoice } from "../api/invoiceApi.js";
import { uploadInvoiceImage } from "../api/uploadApi.js";
import { roundMoney } from "../utils/currency.js";
import { combineDateAndTime, dateOnlyToPayload, toInputDate, toInputTimeParts, toOptionalInputDate } from "../utils/date.js";

const emptyCustomer = { name: "", phone: "", email: "", address: "", vehicleNumber: "", vehicleKm: "" };
const toOptionalNumber = (value) => value === "" || value === null || value === undefined ? null : Number(value);
const buildLineItemPayload = (item) => ({
  ...item,
  amount: roundMoney(Number(item.quantity || 0) * Number(item.unitPrice || 0))
});
const buildVehiclePayload = (vehicleDetails) => ({
  ...vehicleDetails,
  yearOfManufacture: toOptionalNumber(vehicleDetails.yearOfManufacture),
  nextServiceKilometer: toOptionalNumber(vehicleDetails.nextServiceKilometer),
  pucExpiryDate: dateOnlyToPayload(vehicleDetails.pucExpiryDate),
  insuranceExpiryDate: dateOnlyToPayload(vehicleDetails.insuranceExpiryDate)
});

const initialForm = {
  invoiceDate: toInputDate(),
  invoiceTime: toInputTimeParts(),
  deliveryDate: "",
  deliveryTime: defaultTimeParts,
  vehicleDetails: emptyVehicleDetails,
  discountAmount: 0,
  receivedAmount: 0,
  paymentMode: "Cash",
  remarks: "",
  lineItems: []
};

export default function EditInvoicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [quickCustomer, setQuickCustomer] = useState(emptyCustomer);
  const [form, setForm] = useState(initialForm);
  const { data: invoice, isLoading } = useQuery({ queryKey: ["invoice", id], queryFn: () => getInvoice(id) });
  const { data: customersData } = useQuery({ queryKey: ["customers", "invoice-picker"], queryFn: () => getCustomers({ limit: 100 }) });
  const { data: itemsData } = useQuery({ queryKey: ["inventory-items", "invoice-picker"], queryFn: () => getInventoryItems({ limit: 200 }) });
  
  useEffect(() => {
    if (invoice) {
      setForm({
        invoiceDate: toInputDate(invoice.invoiceDate),
        invoiceTime: toInputTimeParts(invoice.invoiceDate),
        deliveryDate: toOptionalInputDate(invoice.deliveryDate),
        deliveryTime: invoice.deliveryDate ? toInputTimeParts(invoice.deliveryDate) : defaultTimeParts,
        vehicleDetails: {
          carName: invoice.carName || "",
          carBrand: invoice.carBrand || "",
          fuelType: invoice.fuelType || "",
          yearOfManufacture: invoice.yearOfManufacture || "",
          nextServiceKilometer: invoice.nextServiceKilometer || "",
          pucExpiryDate: toOptionalInputDate(invoice.pucExpiryDate),
          insuranceExpiryDate: toOptionalInputDate(invoice.insuranceExpiryDate)
        },
        discountAmount: invoice.discountAmount || 0,
        receivedAmount: invoice.receivedAmount || 0,
        paymentMode: invoice.paymentMode || "Cash",
        remarks: invoice.remarks || invoice.description || "",
        lineItems: invoice.lineItems || []
      });
      if (invoice.customer) {
        setQuickCustomer({
          name: invoice.customer.name || "",
          phone: invoice.customer.phone || "",
          email: invoice.customer.email || "",
          address: invoice.customer.address || "",
          vehicleNumber: invoice.customer.vehicleNumber || "",
          vehicleKm: invoice.customer.vehicleKm || ""
        });
        if (invoice.customer.customerId) {
          setSelectedCustomerId(invoice.customer.customerId);
        }
      }
    }
  }, [invoice]);
  
  const customers = customersData?.items || [];
  
  const handleCustomerSelect = (customerId) => {
    setSelectedCustomerId(customerId);
    const c = customers.find((item) => item._id === customerId);
    if (!c) {
      setQuickCustomer(emptyCustomer);
      return;
    }
    setQuickCustomer({
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      vehicleNumber: c.vehicleNumber || "",
      vehicleKm: c.vehicleKm || ""
    });
  };

  const subTotal = useMemo(() => form.lineItems.reduce((sum, item) => sum + roundMoney(Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0), [form.lineItems]);
  const mutation = useMutation({
    mutationFn: () => updateInvoice({ 
      id, 
      payload: { 
        invoiceDate: combineDateAndTime(form.invoiceDate, form.invoiceTime),
        deliveryDate: form.deliveryDate ? combineDateAndTime(form.deliveryDate, form.deliveryTime) : null,
        ...buildVehiclePayload(form.vehicleDetails),
        discountAmount: Number(form.discountAmount || 0),
        receivedAmount: Number(form.receivedAmount || 0),
        paymentMode: form.paymentMode,
        remarks: form.remarks,
        customerId: selectedCustomerId || undefined,
        customer: selectedCustomerId ? { ...quickCustomer, customerId: selectedCustomerId } : quickCustomer,
        lineItems: form.lineItems.map(buildLineItemPayload) 
      } 
    }),
    onSuccess: () => { toast.success("Invoice updated"); queryClient.invalidateQueries({ queryKey: ["invoices"] }); queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }); navigate("/invoices"); },
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
      <div className="page-header"><div><h2>Edit Invoice {invoice?.invoiceCode}</h2><p>Invoice number stays unchanged.</p></div><Link className="btn btn-secondary" to={"/invoices/" + id}>Back</Link></div>
      <div className="panel page">
        <CustomerPicker customers={customers} selectedCustomerId={selectedCustomerId} quickCustomer={quickCustomer} onSelect={handleCustomerSelect} onQuickChange={(patch) => setQuickCustomer((current) => ({ ...current, ...patch }))} />
        <div className="form-grid invoice-date-grid" style={{ margin: "16px 0" }}>
          <DateTimeFields dateLabel="Invoice date" dateValue={form.invoiceDate} timeValue={form.invoiceTime} onDateChange={(invoiceDate) => setForm((current) => ({ ...current, invoiceDate }))} onTimeChange={(invoiceTime) => setForm((current) => ({ ...current, invoiceTime }))} />
          <DateTimeFields dateLabel="Delivery date" dateValue={form.deliveryDate} timeValue={form.deliveryTime} onDateChange={(deliveryDate) => setForm((current) => ({ ...current, deliveryDate }))} onTimeChange={(deliveryTime) => setForm((current) => ({ ...current, deliveryTime }))} />
          <Input label="Discount" type="number" min="0" value={form.discountAmount} onChange={(event) => setForm((current) => ({ ...current, discountAmount: event.target.value }))} />
        </div>
        <VehicleDetailsFields value={form.vehicleDetails} onChange={(vehicleDetails) => setForm((current) => ({ ...current, vehicleDetails }))} />
        <LineItemsTable lineItems={form.lineItems} setLineItems={(updater) => setForm((current) => ({ ...current, lineItems: typeof updater === "function" ? updater(current.lineItems) : updater }))} inventoryItems={itemsData?.items || []} onUploadImage={uploadImage} />
        <PaymentBox paymentMode={form.paymentMode} receivedAmount={form.receivedAmount} onChange={(patch) => setForm((current) => ({ ...current, ...patch }))} />
        <div className="invoice-summary-layout">
          <div className="invoice-summary-desc">
            <Textarea label="Remarks" value={form.remarks} onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))} />
          </div>
          <div className="invoice-summary-totals">
            <InvoiceTotalsBox subTotal={subTotal} discountAmount={form.discountAmount} receivedAmount={form.receivedAmount} />
          </div>
        </div>
        <div className="form-actions right-actions" style={{ marginTop: "20px" }}><Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>Save changes</Button></div>
      </div>
    </section>
  );
}
