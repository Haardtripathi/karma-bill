import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../components/common/Button.jsx";
import FileUpload from "../components/common/FileUpload.jsx";
import Input from "../components/common/Input.jsx";
import Textarea from "../components/common/Textarea.jsx";
import Loader from "../components/common/Loader.jsx";
import {
  createInventoryItem,
  createInventoryItemType,
  getInventoryItem,
  getInventoryItemTypes,
  updateInventoryItem,
  uploadInventoryItemImage
} from "../api/inventoryItemApi.js";

const blank = { name: "", type: "service", unit: "pcs", defaultPrice: 0, stockQty: 0, lowStockQty: 0, description: "" };
const fallbackTypes = ["service", "part", "other"];
const normalizeTypeName = (value) => value.trim().replace(/\s+/g, " ").toLowerCase();

export default function InventoryItemFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(blank);
  const [imageFile, setImageFile] = useState(null);
  const { data, isLoading } = useQuery({ queryKey: ["inventory-item", id], queryFn: () => getInventoryItem(id), enabled: Boolean(id) });
  const { data: typeData } = useQuery({ queryKey: ["inventory-item-types"], queryFn: () => getInventoryItemTypes() });
  useEffect(() => { if (data) setForm({ ...blank, ...data }); }, [data]);
  const savedTypeOptions = typeData?.items?.map((itemType) => itemType.name) || fallbackTypes;
  const typeOptions = Array.from(new Set(savedTypeOptions.filter(Boolean)));
  const trimmedType = form.type.trim();
  const selectedTypeExists = savedTypeOptions.some((name) => normalizeTypeName(name) === normalizeTypeName(trimmedType));
  const saveMutation = useMutation({
    mutationFn: async () => {
      const saved = id ? await updateInventoryItem({ id, payload: form }) : await createInventoryItem(form);
      if (imageFile) await uploadInventoryItemImage({ id: saved._id, file: imageFile });
      return saved;
    },
    onSuccess: () => { toast.success("Inventory item saved"); queryClient.invalidateQueries({ queryKey: ["inventory-items"] }); navigate("/inventory-items"); },
    onError: (error) => toast.error(error.message)
  });
  const createTypeMutation = useMutation({
    mutationFn: createInventoryItemType,
    onSuccess: (saved) => {
      toast.success("Type added");
      queryClient.invalidateQueries({ queryKey: ["inventory-item-types"] });
      set({ type: saved.name });
    },
    onError: (error) => toast.error(error.message)
  });
  if (id && isLoading) return <Loader />;
  const set = (patch) => setForm((current) => ({ ...current, ...patch }));
  const handleAddType = () => {
    if (!trimmedType || selectedTypeExists) return;
    createTypeMutation.mutate({ name: trimmedType });
  };

  return (
    <section className="page">
      <div className="page-header"><div><h2>{id ? "Edit" : "Add"} Inventory Item</h2><p>Configure item defaults.</p></div><Link className="btn btn-secondary" to="/inventory-items">Back</Link></div>
      <form className="panel page" onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(); }}>
        <div className="form-grid two">
          <Input label="Name" required value={form.name} onChange={(event) => set({ name: event.target.value })} />
          <div className="field-with-action">
            <Autocomplete
              className="field type-combobox"
              freeSolo
              openOnFocus
              forcePopupIcon
              selectOnFocus
              handleHomeEndKeys
              clearOnBlur={false}
              options={typeOptions}
              value={form.type || ""}
              inputValue={form.type || ""}
              onChange={(event, value) => set({ type: value || "" })}
              onInputChange={(event, value) => set({ type: value })}
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
                      fontSize: 13
                    }
                  }
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Type"
                  required
                  variant="outlined"
                  size="small"
                  fullWidth
                  slotProps={{
                    ...params.slotProps,
                    htmlInput: {
                      ...params.slotProps?.htmlInput,
                      maxLength: 60
                    }
                  }}
                />
              )}
            />
            <Button variant="secondary" onClick={handleAddType} disabled={!trimmedType || selectedTypeExists || createTypeMutation.isPending}><Plus size={15} />Add type</Button>
          </div>
          <Input label="Unit" value={form.unit} onChange={(event) => set({ unit: event.target.value })} />
          <Input label="Default price" type="number" min="0" step="0.01" value={form.defaultPrice} onChange={(event) => set({ defaultPrice: event.target.value })} />
          <Input label="Stock qty" type="number" min="0" value={form.stockQty} onChange={(event) => set({ stockQty: event.target.value })} />
          <Input label="Low stock qty" type="number" min="0" value={form.lowStockQty} onChange={(event) => set({ lowStockQty: event.target.value })} />
          <Textarea className="span-two" label="Description" value={form.description} onChange={(event) => set({ description: event.target.value })} />
        </div>
        <div className="actions-row upload-actions"><FileUpload label="Image upload" onChange={setImageFile} />{imageFile && <span>{imageFile.name}</span>}</div>
        <div className="form-actions"><Button type="submit" disabled={saveMutation.isPending}>Save item</Button></div>
      </form>
    </section>
  );
}
