import { amountToWords } from "../../utils/amountToWords.js";
import { formatDate } from "../../utils/date.js";

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

export default function InvoiceTemplate({ invoice, company }) {
  if (!invoice || !company) return null;
  const totalQuantity = invoice.lineItems?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;
  const hasDiscount = Number(invoice.discountAmount || 0) > 0;
  const logoUrl = company.logoUrl || "/logo.webp";
  const hasBrandLogo = !!logoUrl;

  return (
    <article className="invoice-template">
      <header className="invoice-title">{company.invoiceTitle || "Tax Invoice"}</header>

      <section className="invoice-company">
        <div className={`invoice-logo-area brand-logo-area`}>
          <img className="invoice-logo-image" src={logoUrl} alt="Company logo" />
        </div>
        <div className="invoice-company-info no-heading">
          <p>{companyAddress(company)}</p>
          <div className="invoice-company-contact">
            <span><strong>Phone:</strong> {company.phone}</span>
            <span><strong>Email:</strong> {company.email}</span>
          </div>
        </div>
      </section>

      <section className="invoice-meta-grid">
        <div className="invoice-bill-to">
          <div className="invoice-section-label">Bill To:</div>
          <div className="invoice-customer-name">{invoice.customer?.name}</div>
          {invoice.customer?.address && <div className="invoice-customer-address">{invoice.customer.address}</div>}
          {invoice.customer?.phone && <div className="invoice-customer-address">Phone: {invoice.customer.phone}</div>}
        </div>
        <div className="invoice-details-box">
          <div className="invoice-section-label">Invoice Details:</div>
          <div className="invoice-detail-row"><span>No:</span><span>{invoice.invoiceCode || invoice.invoiceNumber}</span></div>
          <div className="invoice-detail-row"><span>Date:</span><span>{formatDate(invoice.invoiceDate)}</span></div>
        </div>
      </section>

      <div className="invoice-table-wrap">
        <table className="invoice-lines">
          <thead>
            <tr>
              <th style={{ width: 34 }}>#</th>
              <th>Item Name</th>
              <th style={{ width: 86 }}>HSN/ SAC</th>
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
                <td>{item.hsnSac}</td>
                <td className="right">{formatQuantity(item.quantity)}</td>
                <td className="right">{formatBillCurrency(item.unitPrice)}</td>
                <td className="right">{formatBillCurrency(item.amount)}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td></td>
              <td><strong>Total</strong></td>
              <td></td>
              <td className="right"><strong>{formatQuantity(totalQuantity)}</strong></td>
              <td></td>
              <td className="right"><strong>{formatBillCurrency(invoice.grandTotal)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <section className="invoice-summary-section">
        <div className="invoice-payment-mode">
          <div className="invoice-section-label">Payment Mode:</div>
          <div>{invoice.paymentMode || company.defaultPaymentMode || "Cash"}</div>
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
          <div className="invoice-section-label">Description:</div>
          {invoice.customer?.vehicleNumber && <div className="desc-item">{invoice.customer.vehicleNumber}</div>}
          {invoice.customer?.vehicleKm && <div className="desc-item">KM:-{invoice.customer.vehicleKm}</div>}
          {invoice.description && <div className="desc-next">{invoice.description}</div>}
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
