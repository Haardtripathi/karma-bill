import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../components/common/Button.jsx";
import Input from "../components/common/Input.jsx";
import Textarea from "../components/common/Textarea.jsx";
import Loader from "../components/common/Loader.jsx";
import { createCustomer, getCustomer, updateCustomer } from "../api/customerApi.js";

const blank = { name: "", phone: "", email: "", address: "", vehicleNumber: "", vehicleKm: "", notes: "" };
const toVehicleNumber = (value) => String(value || "").toUpperCase();

export default function CustomerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(blank);
  const { data, isLoading } = useQuery({ queryKey: ["customer", id], queryFn: () => getCustomer(id), enabled: Boolean(id) });
  useEffect(() => { if (data) setForm({ ...blank, ...data }); }, [data]);
  const saveMutation = useMutation({
    mutationFn: () => id ? updateCustomer({ id, payload: form }) : createCustomer(form),
    onSuccess: () => { toast.success("Customer saved"); queryClient.invalidateQueries({ queryKey: ["customers"] }); navigate("/customers"); },
    onError: (error) => toast.error(error.message)
  });
  if (id && isLoading) return <Loader />;
  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  return (
    <section className="page">
      <div className="page-header"><div><h2>{id ? "Edit" : "Add"} Customer</h2><p>Customer and vehicle details.</p></div><Link className="btn btn-secondary" to="/customers">Back</Link></div>
      <form className="panel page" onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(); }}>
        <div className="form-grid two">
          <Input label="Name" required value={form.name} onChange={(event) => set({ name: event.target.value })} />
          <Input label="Phone" required value={form.phone} onChange={(event) => set({ phone: event.target.value })} />
          <Input label="Email" value={form.email} onChange={(event) => set({ email: event.target.value })} />
          <Input label="Vehicle number" value={form.vehicleNumber} inputProps={{ style: { textTransform: "uppercase" } }} onChange={(event) => set({ vehicleNumber: toVehicleNumber(event.target.value) })} />
          <Input label="Vehicle KM" value={form.vehicleKm} onChange={(event) => set({ vehicleKm: event.target.value })} />
          <Input label="Address" value={form.address} onChange={(event) => set({ address: event.target.value })} />
          <Textarea className="span-two" label="Notes" value={form.notes} onChange={(event) => set({ notes: event.target.value })} />
        </div>
        <div className="form-actions"><Button type="submit" disabled={saveMutation.isPending}>Save customer</Button></div>
      </form>
    </section>
  );
}
