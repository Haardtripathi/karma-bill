const { formatDate } = require("../utils/date.util");
const amountToWords = require("../utils/amountToWords.util");

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatBillCurrency = (value) =>
  `₹ ${new Intl.NumberFormat("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(value || 0))}`;

const formatQuantity = (value) => {
  const quantity = Number(value || 0);
  if (Number.isInteger(quantity)) return String(quantity);
  return String(Number(quantity.toFixed(2)));
};

const companyAddress = (company) =>
  [
    company.addressLine1,
    company.addressLine2,
    [company.city, company.state, company.pincode].filter(Boolean).join(" - ")
  ]
    .filter(Boolean)
    .join(", ");

const hasTestMarker = (value) => /E2E-\d+/.test(String(value || ""));

const cleanTerms = (invoice, company) => {
  const terms = invoice.terms || company.defaultTerms || "Thank you for doing business with us.";
  return hasTestMarker(terms) ? "Thank you for doing business with us." : terms;
};

const hasUsableImage = (url) => url && !hasTestMarker(url);

const imageLink = (item) =>
  item.imageUrl
    ? `<a class="image-link" href="${escapeHtml(item.imageUrl)}" target="_blank">View Image</a>`
    : "";

const logoMarkup = (company) =>
  hasUsableImage(company.logoUrl)
    ? `<img class="invoice-logo-image" src="${escapeHtml(company.logoUrl)}" alt="Company logo" />`
    : `<div class="invoice-logo-circle"></div>`;

const signatureMarkup = (company) =>
  hasUsableImage(company.signatureImageUrl)
    ? `<img src="${escapeHtml(company.signatureImageUrl)}" alt="Signature" />`
    : `<svg class="sig-svg" viewBox="0 0 110 45" xmlns="http://www.w3.org/2000/svg" fill="none">
        <path d="M10 30 Q20 10 30 25 Q40 38 50 20 Q58 8 65 28 Q72 42 80 22 Q88 8 100 18" stroke="#333" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M60 35 Q70 30 85 38" stroke="#333" stroke-width="1.4" stroke-linecap="round" />
      </svg>`;

const invoiceTemplate = ({ invoice, company }) => {
  const totalQuantity = invoice.lineItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const hasDiscount = Number(invoice.discountAmount || 0) > 0;
  const hasBrandLogo = hasUsableImage(company.logoUrl);
  const rows = invoice.lineItems
    .map(
      (item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>
          <span class="invoice-item-name">${escapeHtml(item.itemName)}</span>
          ${item.imageNote ? `<small>${escapeHtml(item.imageNote)}</small>` : ""}
          ${imageLink(item)}
        </td>
        <td>${escapeHtml(item.hsnSac)}</td>
        <td class="right">${formatQuantity(item.quantity)}</td>
        <td class="right">${formatBillCurrency(item.unitPrice)}</td>
        <td class="right">${formatBillCurrency(item.amount)}</td>
      </tr>`
    )
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(invoice.invoiceCode)} - ${escapeHtml(company.businessName)}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Roboto, Arial, Helvetica, sans-serif; color: #111; margin: 0; background: #fff; font-size: 13px; line-height: 1.25; }
    .invoice { width: 100%; border: 1px solid #bbb; background: #fff; }
    .invoice-title { text-align: center; font-size: 15px; font-weight: 700; padding: 10px 0 8px; border-bottom: 1px solid #bbb; letter-spacing: .5px; }
    .invoice-company { display: flex; align-items: center; gap: 14px; padding: 12px 16px 10px; border-bottom: 1px solid #bbb; }
    .invoice-logo-area { display: flex; flex-direction: column; align-items: center; min-width: 70px; }
    .invoice-logo-area.brand-logo-area { min-width: 118px; }
    .invoice-logo-circle { width: 44px; height: 44px; border-radius: 50%; background: radial-gradient(circle at 38% 38%, #c8d8f0 0%, #7090c0 35%, #1a2a60 70%, #0a0a20 100%); border: 2px solid #333; box-shadow: 0 2px 8px rgba(0,0,0,.25); margin-bottom: 4px; position: relative; overflow: hidden; }
    .invoice-logo-circle::after { content: ''; position: absolute; top: 8px; left: 8px; width: 12px; height: 8px; background: rgba(255,255,255,.35); border-radius: 50%; transform: rotate(-30deg); }
    .invoice-logo-image { width: 48px; height: 48px; object-fit: contain; margin-bottom: 4px; }
    .brand-logo-area .invoice-logo-image { width: 112px; height: 62px; margin-bottom: 0; }
    .invoice-logo-text { font-size: 9px; letter-spacing: 3px; font-weight: 700; color: #333; }
    .invoice-company-info { flex: 1; min-width: 0; }
    .invoice-company-info.no-heading { display: flex; flex-direction: column; justify-content: center; min-height: 62px; }
    .invoice-company-info h1 { margin: 0 0 5px; font-size: 28px; font-weight: 700; color: #1a1a4e; letter-spacing: 1px; line-height: 1; }
    .invoice-company-info p { margin: 0 0 4px; font-size: 11px; color: #444; }
    .invoice-company-info.no-heading p { margin-bottom: 6px; font-size: 12px; }
    .invoice-company-contact { display: flex; flex-wrap: wrap; gap: 14px 40px; font-size: 11px; color: #444; }
    .invoice-company-contact strong { font-weight: 600; }
    .invoice-meta-grid { display: flex; border-bottom: 1px solid #bbb; }
    .invoice-meta-grid > div { flex: 1; padding: 8px 14px; min-height: 74px; }
    .invoice-bill-to { border-right: 1px solid #bbb; }
    .invoice-section-label { font-weight: 700; font-size: 12px; margin-bottom: 5px; text-decoration: underline; }
    .invoice-customer-name { font-weight: 700; font-size: 13px; }
    .invoice-customer-address { font-size: 12px; color: #333; }
    .invoice-detail-row { font-size: 12px; display: flex; gap: 6px; margin-bottom: 1px; }
    .invoice-detail-row span:first-child { font-weight: 600; min-width: 34px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #e8e8e8; }
    th { padding: 7px 8px; font-size: 12px; font-weight: 700; text-align: left; border: 1px solid #bbb; white-space: nowrap; background: #e8e8e8; }
    td { padding: 6px 8px; font-size: 12px; border: 1px solid #ddd; vertical-align: top; }
    td:first-child { text-align: center; }
    .right { text-align: right; }
    tbody tr:nth-child(even) { background: #fafafa; }
    .total-row td { font-weight: 700; background: #f0f0f0 !important; border-top: 2px solid #999; }
    .invoice-item-name { font-weight: 500; }
    small, .image-link { display: block; margin-top: 4px; color: #1a5ce6; font-size: 11.5px; }
    .invoice-summary-section { display: flex; border-top: 1px solid #bbb; }
    .invoice-payment-mode { flex: 1; padding: 7px 14px; border-right: 1px solid #bbb; font-size: 12px; }
    .invoice-summary-right { min-width: 300px; }
    .summary-row { display: grid; grid-template-columns: 1fr auto minmax(90px, auto); align-items: center; gap: 6px; padding: 5px 14px; border-bottom: 1px solid #ddd; font-size: 12px; }
    .summary-row.bold { font-weight: 700; }
    .summary-row .label { font-weight: 600; }
    .summary-row .value { text-align: right; font-weight: 700; }
    .amount-words { padding: 5px 14px 6px; border-bottom: 1px solid #ddd; font-size: 11.5px; }
    .amount-words .aw-label { font-weight: 700; margin-bottom: 2px; font-size: 12px; }
    .invoice-footer-section { display: flex; border-top: 2px solid #bbb; }
    .invoice-desc-section { flex: 1; padding: 8px 14px; border-right: 1px solid #bbb; min-height: 128px; }
    .desc-item { font-size: 11.5px; color: #1a5ce6; margin-bottom: 3px; }
    .desc-next { font-size: 11.5px; color: #111; margin-top: 3px; }
    .terms-sig-section { min-width: 320px; display: flex; flex-direction: column; }
    .terms-block { padding: 8px 14px; border-bottom: 1px solid #bbb; flex: 1; }
    .terms-text { font-size: 11.5px; color: #333; }
    .sig-block { padding: 8px 14px 12px; border-top: 1px solid #bbb; }
    .sig-label { font-weight: 700; font-size: 12px; margin-bottom: 6px; }
    .sig-image { height: 44px; display: flex; align-items: center; margin-bottom: 2px; }
    .sig-image img { max-height: 42px; max-width: 120px; object-fit: contain; }
    .sig-svg { height: 40px; width: 100px; }
    .sig-auth { font-size: 11px; color: #333; margin-top: 2px; }
    @media print { body { margin: 0; } a { color: #111; text-decoration: none; } .invoice { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="invoice-title">${escapeHtml(company.invoiceTitle || "Tax Invoice")}</div>
    <div class="invoice-company">
      <div class="invoice-logo-area${hasBrandLogo ? " brand-logo-area" : ""}">
        ${logoMarkup(company)}
        ${hasBrandLogo ? "" : `<div class="invoice-logo-text">KARMA</div>`}
      </div>
      <div class="invoice-company-info${hasBrandLogo ? " no-heading" : ""}">
        ${hasBrandLogo ? "" : `<h1>${escapeHtml(company.businessName || "KARMA AUTOMOBILES")}</h1>`}
        <p>${escapeHtml(companyAddress(company))}</p>
        <div class="invoice-company-contact">
          <span><strong>Phone:</strong> ${escapeHtml(company.phone || "")}</span>
          <span><strong>Email:</strong> ${escapeHtml(company.email || "")}</span>
        </div>
      </div>
    </div>

    <div class="invoice-meta-grid">
      <div class="invoice-bill-to">
        <div class="invoice-section-label">Bill To:</div>
        <div class="invoice-customer-name">${escapeHtml(invoice.customer?.name || "")}</div>
        ${invoice.customer?.address ? `<div class="invoice-customer-address">${escapeHtml(invoice.customer.address)}</div>` : ""}
        ${invoice.customer?.phone ? `<div class="invoice-customer-address">Phone: ${escapeHtml(invoice.customer.phone)}</div>` : ""}
      </div>
      <div class="invoice-details-box">
        <div class="invoice-section-label">Invoice Details:</div>
        <div class="invoice-detail-row"><span>No:</span><span>${escapeHtml(invoice.invoiceCode || invoice.invoiceNumber)}</span></div>
        <div class="invoice-detail-row"><span>Date:</span><span>${formatDate(invoice.invoiceDate)}</span></div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:34px;">#</th>
          <th>Item Name</th>
          <th style="width:86px;">HSN/ SAC</th>
          <th class="right" style="width:82px;">Quantity</th>
          <th class="right" style="width:112px;">Price/ Unit(₹)</th>
          <th class="right" style="width:104px;">Amount(₹)</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr class="total-row">
          <td></td>
          <td><strong>Total</strong></td>
          <td></td>
          <td class="right"><strong>${formatQuantity(totalQuantity)}</strong></td>
          <td></td>
          <td class="right"><strong>${formatBillCurrency(invoice.grandTotal)}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="invoice-summary-section">
      <div class="invoice-payment-mode">
        <div class="invoice-section-label">Payment Mode:</div>
        <div>${escapeHtml(invoice.paymentMode || company.defaultPaymentMode || "Cash")}</div>
      </div>
      <div class="invoice-summary-right">
        <div class="summary-row"><span class="label">Sub Total</span><span class="colon">:</span><span class="value">${formatBillCurrency(invoice.subTotal)}</span></div>
        ${hasDiscount ? `<div class="summary-row"><span class="label">Discount</span><span class="colon">:</span><span class="value">${formatBillCurrency(invoice.discountAmount)}</span></div>` : ""}
        <div class="summary-row bold"><span class="label">Total</span><span class="colon">:</span><span class="value">${formatBillCurrency(invoice.grandTotal)}</span></div>
        <div class="amount-words"><div class="aw-label">Invoice Amount in Words:</div><div>${escapeHtml(amountToWords(invoice.grandTotal).replace(/ Only$/, " only"))}</div></div>
        <div class="summary-row"><span class="label">Received</span><span class="colon">:</span><span class="value">${formatBillCurrency(invoice.receivedAmount)}</span></div>
        <div class="summary-row"><span class="label">Balance</span><span class="colon">:</span><span class="value">${formatBillCurrency(invoice.balanceAmount)}</span></div>
      </div>
    </div>

    <div class="invoice-footer-section">
      <div class="invoice-desc-section">
        <div class="invoice-section-label">Description:</div>
        ${invoice.customer?.vehicleNumber ? `<div class="desc-item">${escapeHtml(invoice.customer.vehicleNumber)}</div>` : ""}
        ${invoice.customer?.vehicleKm ? `<div class="desc-item">KM:-${escapeHtml(invoice.customer.vehicleKm)}</div>` : ""}
        ${invoice.description ? `<div class="desc-next">${escapeHtml(invoice.description)}</div>` : ""}
      </div>
      <div class="terms-sig-section">
        <div class="terms-block">
          <div class="invoice-section-label">Terms &amp; Conditions:</div>
          <div class="terms-text">${escapeHtml(cleanTerms(invoice, company))}</div>
          ${invoice.mapsLink || company.mapsLink ? `<a class="image-link" href="${escapeHtml(invoice.mapsLink || company.mapsLink)}">Location</a>` : ""}
        </div>
        <div class="sig-block">
          <div class="sig-label">For ${escapeHtml(company.businessName || "KARMA AUTOMOBILES")}:</div>
          <div class="sig-image">${signatureMarkup(company)}</div>
          <div class="sig-auth">Authorized Signatory</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

module.exports = invoiceTemplate;
