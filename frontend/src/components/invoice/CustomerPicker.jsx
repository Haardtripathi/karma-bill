import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Input from "../common/Input.jsx";

const toVehicleNumber = (value) => String(value || "").toUpperCase();

export default function CustomerPicker({ customers = [], selectedCustomerId, quickCustomer, onSelect, onQuickChange }) {
  const selectedCustomer = customers.find((c) => c._id === selectedCustomerId) || null;

  return (
    <div className="panel-section customer-picker">
      <div className="section-heading">
        <div>
          <h2>Customer</h2>
          <p>Select an existing customer or type the details for this invoice. Vehicle number, KM and contact details stay editable for each visit.</p>
        </div>
      </div>
      <Autocomplete
        className="field customer-combobox"
        size="small"
        fullWidth
        options={customers}
        value={selectedCustomer}
        getOptionLabel={(option) => option ? `${option.name} - ${option.phone}` : ""}
        isOptionEqualToValue={(option, value) => option._id === value?._id}
        onChange={(event, value) => {
          onSelect(value ? value._id : "");
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search Existing Customer"
            variant="outlined"
            placeholder="Type name or phone to search..."
            slotProps={{
              ...params.slotProps,
              htmlInput: {
                ...params.slotProps?.htmlInput,
                "aria-label": "Search Existing Customer"
              }
            }}
          />
        )}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              border: "1px solid #dce3ec",
              borderRadius: "6px",
              boxShadow: "0 14px 34px rgba(15, 23, 42, .14)"
            }
          },
          listbox: {
            sx: {
              py: 0.5,
              "& .MuiAutocomplete-option": {
                minHeight: 36,
                px: 1.5,
                py: 0.75,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 0.25,
                fontSize: 13
              }
            }
          }
        }}
        renderOption={(props, option) => {
          const { key, ...optionProps } = props;
          return (
            <li key={key} {...optionProps}>
              <strong style={{ display: "block" }}>{option.name}</strong>
              <span style={{ color: "#667085", fontSize: 11 }}>{option.phone}</span>
            </li>
          );
        }}
      />
      <div className="form-grid" style={{ marginTop: "16px" }}>
        <Input label="Name" value={quickCustomer.name} onChange={(event) => onQuickChange({ name: event.target.value })} />
        <Input label="Phone" value={quickCustomer.phone} onChange={(event) => onQuickChange({ phone: event.target.value })} />
        <Input label="Email" value={quickCustomer.email || ""} onChange={(event) => onQuickChange({ email: event.target.value })} />
        <Input label="Vehicle Number" value={quickCustomer.vehicleNumber} inputProps={{ style: { textTransform: "uppercase" } }} onChange={(event) => onQuickChange({ vehicleNumber: toVehicleNumber(event.target.value) })} />
        <Input label="Vehicle KM" value={quickCustomer.vehicleKm} onChange={(event) => onQuickChange({ vehicleKm: event.target.value })} />
        <Input label="Address" value={quickCustomer.address} onChange={(event) => onQuickChange({ address: event.target.value })} />
      </div>
    </div>
  );
}
