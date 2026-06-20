import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
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
import { createInvoice } from "../api/invoiceApi.js";
import { uploadInvoiceImage } from "../api/uploadApi.js";
import { roundMoney } from "../utils/currency.js";
import { combineDateAndTime, dateOnlyToPayload, toInputDate, toInputTimeParts } from "../utils/date.js";

const emptyCustomer = { name: "", phone: "", email: "", address: "", vehicleNumber: "", vehicleKm: "" };
const emptyLine = { itemId: "", itemName: "", quantity: 1, unitPrice: 0, imageUrl: "", imagePublicId: "", imageNote: "" };

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

export default function CreateInvoicePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [quickCustomer, setQuickCustomer] = useState(emptyCustomer);
  const [invoiceDate, setInvoiceDate] = useState(toInputDate());
  const [invoiceTime, setInvoiceTime] = useState(toInputTimeParts());
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState(defaultTimeParts);
  const [vehicleDetails, setVehicleDetails] = useState(emptyVehicleDetails);
  const [lineItems, setLineItems] = useState([emptyLine]);
  const [remarks, setRemarks] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [receivedAmount, setReceivedAmount] = useState(0);
  const { data: customersData, isLoading: customersLoading } = useQuery({ queryKey: ["customers", "invoice-picker"], queryFn: () => getCustomers({ limit: 100 }) });
  const { data: itemsData, isLoading: itemsLoading } = useQuery({ queryKey: ["inventory-items", "invoice-picker"], queryFn: () => getInventoryItems({ limit: 200 }) });
  const customers = customersData?.items || [];
  const inventoryItems = itemsData?.items || [];

  const subTotal = useMemo(() => lineItems.reduce((sum, item) => sum + roundMoney(Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0), [lineItems]);
  const createMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: () => { toast.success("Invoice saved"); queryClient.invalidateQueries({ queryKey: ["invoices"] }); queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }); navigate("/invoices"); },
    onError: (error) => toast.error(error.message)
  });
  const uploadImage = async (file, index) => {
    try {
      const uploaded = await uploadInvoiceImage(file);
      setLineItems((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, imageUrl: uploaded.url, imagePublicId: uploaded.publicId } : row));
      toast.success("Image uploaded");
    } catch (error) { toast.error(error.message); }
  };

  const handleCustomerSelect = (id) => {
    setSelectedCustomerId(id);
    const customer = customers.find((item) => item._id === id);
    if (!customer) {
      setQuickCustomer(emptyCustomer);
      return;
    }
    setQuickCustomer({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      vehicleNumber: customer.vehicleNumber || "",
      vehicleKm: customer.vehicleKm || ""
    });
  };

  const buildPayload = (status, items) => ({
    customerId: selectedCustomerId || undefined,
    customer: selectedCustomerId ? { ...quickCustomer, customerId: selectedCustomerId } : quickCustomer,
    invoiceDate: combineDateAndTime(invoiceDate, invoiceTime),
    deliveryDate: deliveryDate ? combineDateAndTime(deliveryDate, deliveryTime) : null,
    ...buildVehiclePayload(vehicleDetails),
    lineItems: items.map(buildLineItemPayload),
    discountAmount: Number(discountAmount || 0),
    receivedAmount: Number(receivedAmount || 0),
    paymentMode,
    remarks,
    status
  });

  const save = (status) => {
    const activeItems = lineItems.filter((item) => item.itemName && Number(item.quantity) > 0);
    if (!quickCustomer.name || !quickCustomer.phone) return toast.error("Customer name and phone are required");
    if (!activeItems.length) return toast.error("At least one line item is required");
    createMutation.mutate(buildPayload(status, activeItems));
  };

  if (customersLoading || itemsLoading) return <Loader label="Loading invoice form..." />;
  return (
    <section className="page">
      <div className="page-header"><div><h2>Create Invoice</h2><p>Select customer, add service/parts, collect payment and save.</p></div><Link className="btn btn-secondary" to="/invoices">Back</Link></div>
      <div className="panel page">
        <CustomerPicker customers={customers} selectedCustomerId={selectedCustomerId} quickCustomer={quickCustomer} onSelect={handleCustomerSelect} onQuickChange={(patch) => setQuickCustomer((current) => ({ ...current, ...patch }))} />
        <div className="form-grid invoice-date-grid" style={{ margin: "16px 0" }}>
          <DateTimeFields dateLabel="Invoice date" dateValue={invoiceDate} timeValue={invoiceTime} onDateChange={setInvoiceDate} onTimeChange={setInvoiceTime} />
          <DateTimeFields dateLabel="Delivery date" dateValue={deliveryDate} timeValue={deliveryTime} onDateChange={setDeliveryDate} onTimeChange={setDeliveryTime} />
          <Input label="Discount" type="number" min="0" value={discountAmount} onChange={(event) => setDiscountAmount(event.target.value)} />
        </div>
        <VehicleDetailsFields value={vehicleDetails} onChange={setVehicleDetails} />
        <LineItemsTable lineItems={lineItems} setLineItems={setLineItems} inventoryItems={inventoryItems} onUploadImage={uploadImage} />
        <PaymentBox paymentMode={paymentMode} receivedAmount={receivedAmount} onChange={(patch) => { if (patch.paymentMode !== undefined) setPaymentMode(patch.paymentMode); if (patch.receivedAmount !== undefined) setReceivedAmount(patch.receivedAmount); }} />
        <div className="invoice-summary-layout">
          <div className="invoice-summary-desc">
            <Textarea label="Remarks" value={remarks} onChange={(event) => setRemarks(event.target.value)} />
          </div>
          <div className="invoice-summary-totals">
            <InvoiceTotalsBox subTotal={subTotal} discountAmount={discountAmount} receivedAmount={receivedAmount} />
          </div>
        </div>
        <div className="form-actions right-actions" style={{ marginTop: "20px" }}>
          <Button variant="secondary" onClick={() => save("draft")} disabled={createMutation.isPending}>Save draft</Button>
          <Button onClick={() => save("unpaid")} disabled={createMutation.isPending}>Save invoice</Button>
        </div>
      </div>
    </section>
  );
}
