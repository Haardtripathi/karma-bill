import Input from "../common/Input.jsx";
import Select from "../common/Select.jsx";

export default function PaymentBox({ paymentMode, receivedAmount, onChange }) {
  return (
    <div className="form-grid payment-box">
      <Select label="Payment Mode" value={paymentMode} onChange={(event) => onChange({ paymentMode: event.target.value })}>
        {['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'Other'].map((mode) => <option key={mode}>{mode}</option>)}
      </Select>
      <Input label="Received Amount" type="number" min="0" value={receivedAmount} onChange={(event) => onChange({ receivedAmount: event.target.value })} />
    </div>
  );
}
