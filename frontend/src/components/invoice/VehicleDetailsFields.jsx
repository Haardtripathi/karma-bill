import CollapsiblePanel from "../common/CollapsiblePanel.jsx";
import Input from "../common/Input.jsx";
import Select from "../common/Select.jsx";

const fuelTypes = ["Petrol", "Diesel", "Petrol-CNG"];

export const emptyVehicleDetails = {
  carName: "",
  carBrand: "",
  fuelType: "",
  yearOfManufacture: "",
  nextServiceKilometer: "",
  pucExpiryDate: "",
  insuranceExpiryDate: ""
};

export default function VehicleDetailsFields({ value = emptyVehicleDetails, onChange, defaultOpen = false }) {
  const form = { ...emptyVehicleDetails, ...value };
  const set = (patch) => onChange({ ...form, ...patch });

  return (
    <CollapsiblePanel
      className="vehicle-details"
      title="Vehicle Details"
      description="Car and service details for this invoice."
      defaultOpen={defaultOpen}
    >
      <div className="form-grid">
        <Input label="Car name" value={form.carName} onChange={(event) => set({ carName: event.target.value })} />
        <Input label="Car brand" value={form.carBrand} onChange={(event) => set({ carBrand: event.target.value })} />
        <Select label="Fuel type" value={form.fuelType} onChange={(event) => set({ fuelType: event.target.value })}>
          <option value="">Select fuel</option>
          {fuelTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </Select>
        <Input label="Year of manufacture" type="number" min="1900" max="2100" value={form.yearOfManufacture} onChange={(event) => set({ yearOfManufacture: event.target.value })} />
        <Input label="Next service kilometer" type="number" min="0" value={form.nextServiceKilometer} onChange={(event) => set({ nextServiceKilometer: event.target.value })} />
        <Input label="PUC expiry" type="date" value={form.pucExpiryDate} onChange={(event) => set({ pucExpiryDate: event.target.value })} />
        <Input label="Insurance expiry" type="date" value={form.insuranceExpiryDate} onChange={(event) => set({ insuranceExpiryDate: event.target.value })} />
      </div>
    </CollapsiblePanel>
  );
}
