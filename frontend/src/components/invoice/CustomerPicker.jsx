import Select from "../common/Select.jsx";
import Input from "../common/Input.jsx";

export default function CustomerPicker({ customers = [], selectedCustomerId, quickCustomer, onSelect, onQuickChange }) {
  return (
    <div className="panel-section customer-picker">
      <div className="section-heading">
        <div>
          <h2>Customer</h2>
          <p>Select an existing customer or type the details for this invoice. Vehicle number, KM and contact details stay editable for each visit.</p>
        </div>
      </div>
      <Select label="Existing Customer" value={selectedCustomerId} onChange={(event) => onSelect(event.target.value)}>
        <option value="">Create quick customer</option>
        {customers.map((customer) => (
          <option key={customer._id} value={customer._id}>{customer.name} - {customer.phone}</option>
        ))}
      </Select>
      <div className="form-grid two">
        <Input label="Name" value={quickCustomer.name} onChange={(event) => onQuickChange({ name: event.target.value })} />
        <Input label="Phone" value={quickCustomer.phone} onChange={(event) => onQuickChange({ phone: event.target.value })} />
        <Input label="Email" value={quickCustomer.email || ""} onChange={(event) => onQuickChange({ email: event.target.value })} />
        <Input label="Vehicle Number" value={quickCustomer.vehicleNumber} onChange={(event) => onQuickChange({ vehicleNumber: event.target.value })} />
        <Input label="Vehicle KM" value={quickCustomer.vehicleKm} onChange={(event) => onQuickChange({ vehicleKm: event.target.value })} />
        <Input label="Address" value={quickCustomer.address} onChange={(event) => onQuickChange({ address: event.target.value })} />
      </div>
    </div>
  );
}
