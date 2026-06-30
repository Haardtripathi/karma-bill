import Input from "../common/Input.jsx";
import Select from "../common/Select.jsx";
import { cn } from "../../lib/utils.js";

export default function PaymentBox({ paymentMode, receivedAmount, onChange, className = "" }) {
  return (
    <div className={cn("form-grid payment-box", className)}>
      <Select label="Payment Mode" value={paymentMode} onChange={(event) => onChange({ paymentMode: event.target.value })}>
        {['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'Other'].map((mode) => <option key={mode}>{mode}</option>)}
      </Select>
      <Input label="Received Amount" type="number" min="0" value={receivedAmount} onChange={(event) => onChange({ receivedAmount: event.target.value })} />
    </div>
  );
}
