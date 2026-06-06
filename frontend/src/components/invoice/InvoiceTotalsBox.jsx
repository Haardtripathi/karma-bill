import { formatCurrency } from "../../utils/currency.js";

export default function InvoiceTotalsBox({ subTotal = 0, discountAmount = 0, receivedAmount = 0 }) {
  const grandTotal = Math.max(Number(subTotal) - Number(discountAmount || 0), 0);
  const balanceAmount = Math.max(grandTotal - Number(receivedAmount || 0), 0);
  return (
    <div className="totals-box">
      <div><span>Sub Total</span><strong>{formatCurrency(subTotal)}</strong></div>
      <div><span>Discount</span><strong>{formatCurrency(discountAmount)}</strong></div>
      <div><span>Total</span><strong>{formatCurrency(grandTotal)}</strong></div>
      <div><span>Received</span><strong>{formatCurrency(receivedAmount)}</strong></div>
      <div><span>Balance</span><strong>{formatCurrency(balanceAmount)}</strong></div>
    </div>
  );
}
