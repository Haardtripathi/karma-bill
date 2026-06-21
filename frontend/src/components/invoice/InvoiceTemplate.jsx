import { amountToWords } from "../../utils/amountToWords.js";
import { formatDate, formatDateTime } from "../../utils/date.js";

const formatBillCurrency = (value) => `₹ ${new Intl.NumberFormat("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(value || 0))}`;

const formatQuantity = (value) => {
  const quantity = Number(value || 0);
  if (Number.isInteger(quantity)) return String(quantity);
  return String(Number(quantity.toFixed(2)));
};

const companyAddress = (company) => [
  company.addressLine1,
  company.addressLine2,
  [company.city, company.state, company.pincode].filter(Boolean).join(" - ")
].filter(Boolean).join(", ");

const hasTestMarker = (value) => /E2E-\d+/.test(String(value || ""));

const cleanTerms = (invoice, company) => {
  const terms = invoice.terms || company.defaultTerms || "Thank you for doing business with us.";
  return hasTestMarker(terms) ? "Thank you for doing business with us." : terms;
};

const hasUsableImage = (url) => url && !hasTestMarker(url);
const formatMaybeDate = (value) => value ? formatDate(value) : "";
const formatKilometer = (value) => value === undefined || value === null || value === "" ? "" : Number(value).toLocaleString("en-IN");

function BillDetail({ label, value }) {
  if (!value) return null;
  return <div className="bill-detail"><strong>{label}:</strong> <span>{value}</span></div>;
}

function PaymentDetail({ label, value }) {
  if (!value) return null;
  return <div className="payment-detail-row"><strong>{label}</strong><span>{value}</span></div>;
}

function MiniDetail({ label, value }) {
  if (!value) return null;
  return <div className="invoice-mini-row"><strong>{label}:</strong> <span>{value}</span></div>;
}

export default function InvoiceTemplate({ invoice, company }) {
  if (!invoice || !company) return null;
  const totalQuantity = invoice.lineItems?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;
  const hasDiscount = Number(invoice.discountAmount || 0) > 0;
  const logoUrl = company.logoUrl || "/logo.webp";
  const hasBrandLogo = !!logoUrl;
  const remarksText = invoice.remarks || invoice.description || "";
  const billToDetails = [
    ["Vehicle make", invoice.carBrand],
    ["Vehicle name", invoice.carName],
    ["Make year", invoice.yearOfManufacture],
    ["Fuel type", invoice.fuelType],
    ["Num", invoice.customer?.vehicleNumber],
    ["Current km", invoice.customer?.vehicleKm],
    ["Next service km", formatKilometer(invoice.nextServiceKilometer)],
    ["Puc expiry", formatMaybeDate(invoice.pucExpiryDate)],
    ["Insurance expiry", formatMaybeDate(invoice.insuranceExpiryDate)]
  ];
  const paymentMode = invoice.paymentMode || company.defaultPaymentMode || "Cash";
  const showPaymentDetails = ["UPI", "Bank Transfer"].includes(paymentMode);
  const paymentDetails = showPaymentDetails ? [
    ...(paymentMode === "UPI" ? [["UPI ID", company.upiId]] : []),
    ["A/C Name", company.bankAccountName],
    ["Bank", company.bankName],
    ["A/C No", company.bankAccountNumber],
    ["IFSC", company.bankIfsc],
    ["Branch", company.bankBranch]
  ] : [];
  const showPaymentQr = paymentMode === "UPI" && hasUsableImage(company.paymentQrUrl);
  const invoiceQuickDetails = [
    ["Status", invoice.status],
    ["Payment", paymentMode],
    ["Balance", formatBillCurrency(invoice.balanceAmount)]
  ];

  return (
    <article className="invoice-template">
      <div className="invoice-table-wrap">
        <table className="invoice-lines invoice-print-table">
          <thead>
            <tr className="invoice-page-header-row">
              <th colSpan={5} className="invoice-page-header-cell">
                <header className="invoice-title">{company.invoiceTitle || "Tax Invoice"}</header>

                <section className="invoice-company">
                  <div className={`invoice-logo-area brand-logo-area`}>
                    <img className="invoice-logo-image" src={logoUrl} alt="Company logo" />
                  </div>
                  <div className="invoice-company-info no-heading">
                    <h1 className="invoice-business-name">{company.businessName || "KARMA AUTOMOBILES"}</h1>
                    <p>{companyAddress(company)}</p>
                    <div className="invoice-company-contact">
                      <span><strong>Phone:</strong> {company.phone}</span>
                      <span><strong>Email:</strong> {company.email}</span>
                    </div>
                  </div>
                </section>

                <section className="invoice-meta-grid">
                  <div className="invoice-bill-to">
                    <div className="bill-to-layout">
                      <div className="bill-customer-block">
                        <div className="invoice-section-label">Bill To:</div>
                        <div className="invoice-customer-name">{invoice.customer?.name}</div>
                        {invoice.customer?.address && <div className="invoice-customer-address">{invoice.customer.address}</div>}
                        {invoice.customer?.phone && <div className="invoice-customer-address"><strong>Phone:</strong> {invoice.customer.phone}</div>}
                      </div>
                      {billToDetails.some(([, value]) => value) && (
                        <div className="bill-vehicle-block">
                          <div className="invoice-section-label compact">Vehicle / Service:</div>
                          <div className="bill-detail-grid">
                            {billToDetails.map(([label, value]) => <BillDetail key={label} label={label} value={value} />)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="invoice-details-box">
                    <div className="invoice-details-layout">
                      <div className="invoice-detail-main">
                        <div className="invoice-section-label">Invoice Details:</div>
                        <div className="invoice-detail-row"><span>No:</span><span>{invoice.invoiceCode || invoice.invoiceNumber}</span></div>
                        <div className="invoice-detail-row"><span>Date:</span><span>{formatDateTime(invoice.invoiceDate)}</span></div>
                        {invoice.deliveryDate && <div className="invoice-detail-row"><span>Delivery:</span><span>{formatDateTime(invoice.deliveryDate)}</span></div>}
                      </div>
                      <div className="invoice-mini-summary">
                        <div className="invoice-section-label compact">Quick Details:</div>
                        {invoiceQuickDetails.map(([label, value]) => <MiniDetail key={label} label={label} value={value} />)}
                      </div>
                    </div>
                  </div>
                </section>
              </th>
            </tr>
            <tr>
              <th style={{ width: 34 }}>#</th>
              <th>Item Name</th>
              <th className="right" style={{ width: 82 }}>Quantity</th>
              <th className="right" style={{ width: 112 }}>Price/ Unit(₹)</th>
              <th className="right" style={{ width: 104 }}>Amount(₹)</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems?.map((item, index) => (
              <tr key={item._id || index}>
                <td>{index + 1}</td>
                <td>
                  <span className="invoice-item-name">{item.itemName}</span>
                  {item.imageNote && <small>{item.imageNote}</small>}
                  {item.imageUrl && <a className="image-link" href={item.imageUrl} target="_blank" rel="noreferrer">View Image</a>}
                </td>
                <td className="right">{formatQuantity(item.quantity)}</td>
                <td className="right">{formatBillCurrency(item.unitPrice)}</td>
                <td className="right">{formatBillCurrency(item.amount)}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td></td>
              <td><strong>Total</strong></td>
              <td className="right"><strong>{formatQuantity(totalQuantity)}</strong></td>
              <td></td>
              <td className="right"><strong>{formatBillCurrency(invoice.grandTotal)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <section className="invoice-summary-section">
        <div className="invoice-payment-mode">
          <div className="invoice-section-label">Payment Mode: {paymentMode}</div>
          {(paymentDetails.some(([, value]) => value) || showPaymentQr) && (
            <div className="payment-content">
              <div className="payment-detail-list">
                {paymentDetails.map(([label, value]) => <PaymentDetail key={label} label={label} value={value} />)}
              </div>
              {showPaymentQr && <img className="payment-qr" src={company.paymentQrUrl} alt="Payment QR" />}
            </div>
          )}
        </div>
        <div className="invoice-summary-right">
          <div className="summary-row"><span className="label">Sub Total</span><span className="colon">:</span><span className="value">{formatBillCurrency(invoice.subTotal)}</span></div>
          {hasDiscount && <div className="summary-row"><span className="label">Discount</span><span className="colon">:</span><span className="value">{formatBillCurrency(invoice.discountAmount)}</span></div>}
          <div className="summary-row bold"><span className="label">Total</span><span className="colon">:</span><span className="value">{formatBillCurrency(invoice.grandTotal)}</span></div>
          <div className="amount-words"><div className="aw-label">Invoice Amount in Words:</div><div>{amountToWords(invoice.grandTotal)}</div></div>
          <div className="summary-row"><span className="label">Received</span><span className="colon">:</span><span className="value">{formatBillCurrency(invoice.receivedAmount)}</span></div>
          <div className="summary-row"><span className="label">Balance</span><span className="colon">:</span><span className="value">{formatBillCurrency(invoice.balanceAmount)}</span></div>
        </div>
      </section>

      <section className="invoice-footer-section">
        <div className="invoice-desc-section">
          <div className="invoice-section-label">Remarks:</div>
          <div className="remarks-text">{remarksText || " "}</div>
        </div>
        <div className="terms-sig-section">
          <div className="terms-block">
            <div className="invoice-section-label">Terms &amp; Conditions:</div>
            <div className="terms-text">{cleanTerms(invoice, company)}</div>
            {(invoice.mapsLink || company.mapsLink) && <a className="image-link" href={invoice.mapsLink || company.mapsLink} target="_blank" rel="noreferrer">Location</a>}
          </div>
          <div className="sig-block">
            <div className="sig-label">For {company.businessName || "KARMA AUTOMOBILES"}:</div>
            <div className="sig-image">
              {hasUsableImage(company.signatureImageUrl) ? <img src={company.signatureImageUrl} alt="Signature" /> : (
                <svg className="sig-svg" viewBox="0 0 110 45" xmlns="http://www.w3.org/2000/svg" fill="none">
                  <path d="M10 30 Q20 10 30 25 Q40 38 50 20 Q58 8 65 28 Q72 42 80 22 Q88 8 100 18" stroke="#333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M60 35 Q70 30 85 38" stroke="#333" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <div className="sig-auth">Authorized Signatory</div>
          </div>
        </div>
      </section>
    </article>
  );
}
