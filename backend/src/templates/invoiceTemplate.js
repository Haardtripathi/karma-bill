const { formatDate, formatDateTime } = require("../utils/date.util");
const amountToWords = require("../utils/amountToWords.util");
const fs = require("fs");
const path = require("path");

let defaultLogoBase64 = "";
try {
  const logoPath = path.join(__dirname, "../../../frontend/public/logo.webp");
  if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    defaultLogoBase64 = `data:image/webp;base64,${logoBuffer.toString("base64")}`;
  }
} catch (err) {
  console.error("Failed to load default logo", err);
}

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
const formatMaybeDate = (value) => value ? formatDate(value) : "";
const formatKilometer = (value) => value === undefined || value === null || value === "" ? "" : Number(value).toLocaleString("en-IN");
const detailMarkup = (label, value) =>
  value ? `<div class="desc-item"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</div>` : "";
const billDetailMarkup = (label, value) =>
  value ? `<div class="bill-detail"><strong>${escapeHtml(label)}:</strong> <span>${escapeHtml(value)}</span></div>` : "";
const paymentDetailMarkup = (label, value) =>
  value ? `<div class="payment-detail-row"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>` : "";
const miniDetailMarkup = (label, value) =>
  value ? `<div class="invoice-mini-row"><strong>${escapeHtml(label)}:</strong> <span>${escapeHtml(value)}</span></div>` : "";

const imageLink = (item) =>
  item.imageUrl
    ? `<a class="image-link" href="${escapeHtml(item.imageUrl)}" target="_blank">View Image</a>`
    : "";

const logoMarkup = (company) => {
  const logoUrl = company.logoUrl || defaultLogoBase64;
  return logoUrl
    ? `<img class="invoice-logo-image" src="${escapeHtml(logoUrl)}" alt="Company logo" />`
    : `<div class="invoice-logo-circle"></div>`;
};

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
  const logoUrl = company.logoUrl || defaultLogoBase64;
  const hasBrandLogo = !!logoUrl;
  const remarksText = invoice.remarks || invoice.description || "";
  const billToDetailRows = [
    ["Vehicle make", invoice.carBrand],
    ["Vehicle name", invoice.carName],
    ["Make year", invoice.yearOfManufacture],
    ["Fuel type", invoice.fuelType],
    ["Num", invoice.customer?.vehicleNumber],
    ["Current km", invoice.customer?.vehicleKm],
    ["Next service km", formatKilometer(invoice.nextServiceKilometer)],
    ["Puc expiry", formatMaybeDate(invoice.pucExpiryDate)],
    ["Insurance expiry", formatMaybeDate(invoice.insuranceExpiryDate)]
  ].map(([label, value]) => billDetailMarkup(label, value)).join("");
  const paymentMode = invoice.paymentMode || company.defaultPaymentMode || "Cash";
  const showPaymentDetails = ["UPI", "Bank Transfer"].includes(paymentMode);
  const paymentDetailRows = showPaymentDetails ? [
    ...(paymentMode === "UPI" ? [["UPI ID", company.upiId]] : []),
    ["A/C Name", company.bankAccountName],
    ["Bank", company.bankName],
    ["A/C No", company.bankAccountNumber],
    ["IFSC", company.bankIfsc],
    ["Branch", company.bankBranch]
  ].map(([label, value]) => paymentDetailMarkup(label, value)).join("") : "";
  const showPaymentQr = paymentMode === "UPI" && hasUsableImage(company.paymentQrUrl);
  const invoiceQuickRows = [
    ["Status", invoice.status],
    ["Payment", paymentMode],
    ["Balance", formatBillCurrency(invoice.balanceAmount)]
  ].map(([label, value]) => miniDetailMarkup(label, value)).join("");
  const billAddressMarkup = invoice.customer?.address ? `<div class="invoice-customer-address">${escapeHtml(invoice.customer.address)}</div>` : "";
  const billPhoneMarkup = invoice.customer?.phone ? `<div class="invoice-customer-address"><strong>Phone:</strong> ${escapeHtml(invoice.customer.phone)}</div>` : "";
  const billVehicleMarkup = billToDetailRows ? `<div class="bill-vehicle-block"><div class="invoice-section-label compact">Vehicle / Service:</div><div class="bill-detail-grid">${billToDetailRows}</div></div>` : "";
  const deliveryMarkup = invoice.deliveryDate ? `<div class="invoice-detail-row"><span>Delivery:</span><span>${formatDateTime(invoice.deliveryDate)}</span></div>` : "";
  const paymentQrMarkup = showPaymentQr ? `<img class="payment-qr" src="${escapeHtml(company.paymentQrUrl)}" alt="Payment QR" />` : "";
  const paymentContentMarkup = paymentDetailRows || paymentQrMarkup ? `<div class="payment-content"><div class="payment-detail-list">${paymentDetailRows}</div>${paymentQrMarkup}</div>` : "";
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
    .invoice-title { text-align: center; font-size: 15px; font-weight: 800; padding: 10px 0 8px; border-bottom: 1px solid #bbb; letter-spacing: .5px; text-transform: uppercase; }
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
    .invoice-company-info h1, .invoice-business-name { margin: 0 0 5px; font-size: 25px; font-weight: 900; color: #111827; letter-spacing: 1px; line-height: 1; text-transform: uppercase; }
    .invoice-company-info p { margin: 0 0 4px; font-size: 11px; color: #444; }
    .invoice-company-info.no-heading p { margin-bottom: 6px; font-size: 12px; }
    .invoice-company-contact { display: flex; flex-wrap: wrap; gap: 14px 40px; font-size: 11px; color: #444; }
    .invoice-company-contact strong { font-weight: 600; }
    .invoice-meta-grid { display: flex; border-bottom: 1px solid #bbb; }
    .invoice-meta-grid > div { padding: 8px 14px; min-height: 104px; }
    .invoice-bill-to { border-right: 1px solid #bbb; flex: 1.25; }
    .invoice-details-box { flex: 0.75; }
    .invoice-section-label { font-weight: 850; font-size: 12px; margin-bottom: 5px; text-decoration: underline; }
    .invoice-section-label.compact { font-size: 11.5px; margin-bottom: 4px; }
    .bill-to-layout { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: 10px; min-height: 86px; }
    .bill-customer-block, .bill-vehicle-block { min-width: 0; }
    .bill-vehicle-block { border-left: 1px dashed #c9c9c9; padding-left: 10px; }
    .invoice-customer-name { font-weight: 700; font-size: 13px; }
    .invoice-customer-address { font-size: 12px; color: #333; overflow-wrap: anywhere; }
    .bill-detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2px 8px; align-items: start; }
    .bill-detail { font-size: 10.8px; color: #111; line-height: 1.18; overflow-wrap: anywhere; }
    .bill-detail strong { font-weight: 800; }
    .bill-detail span { font-weight: 700; color: #1a5ce6; }
    .invoice-details-layout { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 10px; min-height: 86px; }
    .invoice-detail-main, .invoice-mini-summary { min-width: 0; }
    .invoice-mini-summary { border-left: 1px dashed #c9c9c9; padding-left: 12px; }
    .invoice-detail-row { font-size: 12px; display: flex; gap: 6px; margin-bottom: 2px; overflow-wrap: anywhere; }
    .invoice-detail-row span:first-child { font-weight: 600; min-width: 56px; }
    .invoice-detail-row span:last-child { white-space: normal; overflow-wrap: anywhere; }
    .invoice-mini-row { font-size: 11.5px; line-height: 1.25; margin-bottom: 2px; overflow-wrap: anywhere; }
    .invoice-mini-row strong { font-weight: 800; }
    .invoice-mini-row span { font-weight: 700; color: #111; text-transform: capitalize; }
    table { width: 100%; border-collapse: collapse; }
    .invoice-print-table { page-break-inside: auto; break-inside: auto; }
    .invoice-print-table thead { display: table-header-group; }
    .invoice-print-table tbody { display: table-row-group; }
    .invoice-print-table tbody tr { page-break-inside: avoid; break-inside: avoid; }
    .invoice-page-header-cell { padding: 0 !important; border: 0 !important; background: #fff !important; white-space: normal !important; text-align: left !important; font-weight: 400 !important; }
    .invoice-page-header-row { page-break-inside: avoid; break-inside: avoid; }
    thead tr { background: #e8e8e8; }
    th { padding: 7px 8px; font-size: 12px; font-weight: 700; text-align: left; border: 1px solid #bbb; white-space: nowrap; background: #e8e8e8; }
    td { padding: 6px 8px; font-size: 12px; border: 1px solid #ddd; vertical-align: top; }
    td:first-child { text-align: center; }
    .right { text-align: right; }
    tbody tr:nth-child(even) { background: #fafafa; }
    .total-row td { font-weight: 700; background: #f0f0f0 !important; border-top: 2px solid #999; }
    .invoice-item-name { font-weight: 500; }
    small, .image-link { display: block; margin-top: 4px; color: #1a5ce6; font-size: 11.5px; }
    .invoice-summary-section { display: flex; border-top: 1px solid #bbb; page-break-inside: avoid; break-inside: avoid; }
    .invoice-payment-mode {
      flex: 1;
      padding: 8px 14px;
      border-right: 1px solid #bbb;
      font-size: 12px;
      display: flex;
      flex-direction: column;
    }
    .payment-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex: 1;
      margin-top: 4px;
    }
    .payment-detail-list {
      flex: 1;
      min-width: 0;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px 12px;
    }
    .payment-detail-row {
      font-size: 11px;
      line-height: 1.3;
      display: flex;
      flex-direction: column;
      gap: 1px;
      overflow-wrap: anywhere;
    }
    .payment-detail-row strong {
      font-weight: 600;
      color: #666;
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .payment-detail-row span {
      font-weight: 700;
      color: #111;
      font-size: 11.5px;
    }
    .payment-qr {
      width: 95px;
      height: 95px;
      object-fit: contain;
      border: 1px solid #bbb;
      padding: 4px;
      background: #fff;
      flex: 0 0 auto;
      border-radius: 4px;
    }
    .invoice-summary-right { min-width: 300px; }
    .summary-row { display: grid; grid-template-columns: 1fr auto minmax(90px, auto); align-items: center; gap: 6px; padding: 5px 14px; border-bottom: 1px solid #ddd; font-size: 12px; }
    .summary-row.bold { font-weight: 700; }
    .summary-row .label { font-weight: 600; }
    .summary-row .value { text-align: right; font-weight: 700; }
    .amount-words { padding: 5px 14px 6px; border-bottom: 1px solid #ddd; font-size: 11.5px; }
    .amount-words .aw-label { font-weight: 700; margin-bottom: 2px; font-size: 12px; }
    .invoice-footer-section { display: flex; border-top: 2px solid #bbb; page-break-inside: avoid; break-inside: avoid; }
    .invoice-desc-section { flex: 1; padding: 8px 14px; border-right: 1px solid #bbb; min-height: 104px; }
    .desc-item { font-size: 11.5px; color: #1a5ce6; margin-bottom: 3px; }
    .desc-item strong { color: #111; }
    .remarks-text { font-size: 11.5px; color: #111; font-weight: 700; white-space: pre-wrap; overflow-wrap: anywhere; }
    .terms-sig-section { min-width: 320px; display: flex; flex-direction: column; }
    .terms-block { padding: 8px 14px; border-bottom: 1px solid #bbb; flex: 1; }
    .terms-text { font-size: 11.5px; color: #333; }
    .sig-block { padding: 8px 14px 12px; border-top: 1px solid #bbb; }
    .sig-label { font-weight: 700; font-size: 12px; margin-bottom: 6px; }
    .sig-image { height: 44px; display: flex; align-items: center; margin-bottom: 2px; }
    .sig-image img { max-height: 42px; max-width: 120px; object-fit: contain; }
    .sig-svg { height: 40px; width: 100px; }
    .sig-auth { font-size: 11px; color: #333; margin-top: 2px; }
    @media print { body { margin: 0; } a { color: #111; text-decoration: none; } .invoice { page-break-inside: auto; break-inside: auto; } .invoice-print-table thead { display: table-header-group; } }
  </style>
</head>
<body>
  <div class="invoice">
    <table class="invoice-print-table">
      <thead>
        <tr class="invoice-page-header-row">
          <th colspan="5" class="invoice-page-header-cell">
            <div class="invoice-title">${escapeHtml(company.invoiceTitle || "Tax Invoice")}</div>
            <div class="invoice-company">
              <div class="invoice-logo-area${hasBrandLogo ? " brand-logo-area" : ""}">
                ${logoMarkup(company)}
                ${hasBrandLogo ? "" : `<div class="invoice-logo-text">KARMA</div>`}
              </div>
              <div class="invoice-company-info${hasBrandLogo ? " no-heading" : ""}">
                <h1 class="invoice-business-name">${escapeHtml(company.businessName || "KARMA AUTOMOBILES")}</h1>
                <p>${escapeHtml(companyAddress(company))}</p>
                <div class="invoice-company-contact">
                  <span><strong>Phone:</strong> ${escapeHtml(company.phone || "")}</span>
                  <span><strong>Email:</strong> ${escapeHtml(company.email || "")}</span>
                </div>
              </div>
            </div>

            <div class="invoice-meta-grid">
              <div class="invoice-bill-to">
                <div class="bill-to-layout">
                  <div class="bill-customer-block">
                    <div class="invoice-section-label">Bill To:</div>
                    <div class="invoice-customer-name">${escapeHtml(invoice.customer?.name || "")}</div>
                    ${billAddressMarkup}
                    ${billPhoneMarkup}
                  </div>
                  ${billVehicleMarkup}
                </div>
              </div>
              <div class="invoice-details-box">
                <div class="invoice-details-layout">
                  <div class="invoice-detail-main">
                    <div class="invoice-section-label">Invoice Details:</div>
                    <div class="invoice-detail-row"><span>No:</span><span>${escapeHtml(invoice.invoiceCode || invoice.invoiceNumber)}</span></div>
                    <div class="invoice-detail-row"><span>Date:</span><span>${formatDateTime(invoice.invoiceDate)}</span></div>
                    ${deliveryMarkup}
                  </div>
                  <div class="invoice-mini-summary">
                    <div class="invoice-section-label compact">Quick Details:</div>
                    ${invoiceQuickRows}
                  </div>
                </div>
              </div>
            </div>
          </th>
        </tr>
        <tr>
          <th style="width:34px;">#</th>
          <th>Item Name</th>
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
          <td class="right"><strong>${formatQuantity(totalQuantity)}</strong></td>
          <td></td>
          <td class="right"><strong>${formatBillCurrency(invoice.grandTotal)}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="invoice-summary-section">
      <div class="invoice-payment-mode">
        <div class="invoice-section-label">Payment Mode: ${escapeHtml(paymentMode)}</div>
        ${paymentContentMarkup}
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
        <div class="invoice-section-label">Remarks:</div>
        <div class="remarks-text">${remarksText ? escapeHtml(remarksText) : "&nbsp;"}</div>
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
