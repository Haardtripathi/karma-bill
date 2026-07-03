import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Check, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../components/common/Button.jsx";
import CollapsiblePanel from "../components/common/CollapsiblePanel.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import Input from "../components/common/Input.jsx";
import Select from "../components/common/Select.jsx";
import SearchBar from "../components/common/SearchBar.jsx";
import Loader from "../components/common/Loader.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import Pagination from "../components/common/Pagination.jsx";
import ImagePreview from "../components/common/ImagePreview.jsx";
import useDebounce from "../hooks/useDebounce.js";
import {
  createInventoryItemType,
  deleteInventoryItem,
  deleteInventoryItemType,
  getInventoryItems,
  getInventoryItemTypes,
  updateInventoryItemType
} from "../api/inventoryItemApi.js";
import { formatCurrency } from "../utils/currency.js";

const fallbackTypes = ["service", "part", "other"].map((name) => ({ _id: name, name, isSystem: true }));

export default function InventoryItemsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [newTypeName, setNewTypeName] = useState("");
  const [editingTypeId, setEditingTypeId] = useState("");
  const [editingTypeName, setEditingTypeName] = useState("");
  const [typeToDelete, setTypeToDelete] = useState(null);
  const debounced = useDebounce(search);
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching, refetch } = useQuery({ queryKey: ["inventory-items", debounced, type, page], queryFn: () => getInventoryItems({ search: debounced, type, page, limit: 10 }) });
  const { data: typeData, isLoading: isTypeLoading } = useQuery({ queryKey: ["inventory-item-types"], queryFn: () => getInventoryItemTypes() });
  const itemTypes = typeData?.items?.length ? typeData.items : fallbackTypes;
  const deleteMutation = useMutation({ mutationFn: deleteInventoryItem, onSuccess: () => { toast.success("Item deleted"); queryClient.invalidateQueries({ queryKey: ["inventory-items"] }); } });
  const addTypeMutation = useMutation({
    mutationFn: createInventoryItemType,
    onSuccess: () => {
      toast.success("Type added");
      setNewTypeName("");
      queryClient.invalidateQueries({ queryKey: ["inventory-item-types"] });
    },
    onError: (error) => toast.error(error.message)
  });
  const updateTypeMutation = useMutation({
    mutationFn: updateInventoryItemType,
    onSuccess: (saved, variables) => {
      toast.success("Type updated");
      if (type === variables.previousName) setType(saved.name);
      setEditingTypeId("");
      setEditingTypeName("");
      queryClient.invalidateQueries({ queryKey: ["inventory-item-types"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
    },
    onError: (error) => toast.error(error.message)
  });
  const deleteTypeMutation = useMutation({
    mutationFn: deleteInventoryItemType,
    onSuccess: (removed) => {
      toast.success("Type deleted");
      if (type === removed.name) setType("");
      setTypeToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["inventory-item-types"] });
    },
    onError: (error) => toast.error(error.message)
  });
  const handleRefresh = async () => {
    queryClient.invalidateQueries({ queryKey: ["inventory-items"], refetchType: "none" });
    await refetch();
    toast.success("Items reloaded");
  };
  const handleAddType = (event) => {
    event.preventDefault();
    const name = newTypeName.trim();
    if (!name) return;
    addTypeMutation.mutate({ name });
  };
  const startEditingType = (itemType) => {
    setEditingTypeId(itemType._id);
    setEditingTypeName(itemType.name);
  };
  const saveEditingType = (itemType) => {
    const name = editingTypeName.trim();
    if (!name || name === itemType.name) {
      setEditingTypeId("");
      setEditingTypeName("");
      return;
    }
    updateTypeMutation.mutate({ id: itemType._id, payload: { name }, previousName: itemType.name });
  };
  const activeFilterCount = [search, type].filter(Boolean).length;
  const resultSummary = data?.total !== undefined ? `${data.total} item${data.total === 1 ? "" : "s"}` : "Items";

  return (
    <section className="page">
      <div className="page-header"><div><h2>Inventory Items</h2><p>Parts, services and other billable items.</p></div><Link className="btn btn-primary" to="/inventory-items/new"><Plus size={15} />Add item</Link></div>
      <CollapsiblePanel title="Filters" summary={activeFilterCount ? `${activeFilterCount} active` : "All items"} defaultOpen>
        <div className="toolbar-row">
          <SearchBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search items" />
          <Select label="Filter by type" value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}>
            <option value="">All</option>
            {itemTypes.map((itemType) => <option key={itemType._id} value={itemType.name}>{itemType.name}</option>)}
          </Select>
        </div>
      </CollapsiblePanel>
      <CollapsiblePanel title="Item Types" summary={`${itemTypes.length} saved`} defaultOpen>
        <form className="type-manager-form" onSubmit={handleAddType}>
          <Input label="New type" value={newTypeName} inputProps={{ maxLength: 60 }} onChange={(event) => setNewTypeName(event.target.value)} />
          <Button type="submit" disabled={!newTypeName.trim() || addTypeMutation.isPending}><Plus size={15} />Add type</Button>
        </form>
        {isTypeLoading ? <Loader /> : !itemTypes.length ? <EmptyState title="No item types found" /> : (
          <div className="table-scroll type-table-scroll">
            <table className="data-table type-table">
              <thead><tr><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{itemTypes.map((itemType) => {
                const isEditing = editingTypeId === itemType._id;
                const isBusy = updateTypeMutation.isPending && updateTypeMutation.variables?.id === itemType._id;
                return (
                  <tr key={itemType._id}>
                    <td data-label="Type">
                      {isEditing ? (
                        <Input aria-label={`Edit ${itemType.name} type`} value={editingTypeName} inputProps={{ maxLength: 60 }} onChange={(event) => setEditingTypeName(event.target.value)} />
                      ) : itemType.name}
                    </td>
                    <td data-label="Status">{itemType.isSystem ? "System" : "Custom"}</td>
                    <td className="table-actions" data-label="Actions">
                      {isEditing ? (
                        <>
                          <Button variant="success" onClick={() => saveEditingType(itemType)} disabled={!editingTypeName.trim() || isBusy}><Check size={15} />Save</Button>
                          <Button variant="secondary" onClick={() => { setEditingTypeId(""); setEditingTypeName(""); }}><X size={15} />Cancel</Button>
                        </>
                      ) : (
                        <>
                          <Button variant="secondary" onClick={() => startEditingType(itemType)} disabled={itemType.isSystem}><Pencil size={15} />Edit</Button>
                          <Button variant="danger" onClick={() => setTypeToDelete(itemType)} disabled={itemType.isSystem}><Trash2 size={15} />Delete</Button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </CollapsiblePanel>
      <CollapsiblePanel
        title="Item List"
        summary={isFetching && data ? "Updating..." : resultSummary}
        actions={<Button variant="secondary" onClick={handleRefresh} disabled={isFetching}><RefreshCw size={15} />{isFetching ? "Reloading" : "Reload"}</Button>}
        defaultOpen
      >
        {isLoading ? <Loader /> : !data?.items?.length ? <EmptyState title="No inventory items found" /> : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Type</th><th className="amount-heading">Default price</th><th>Stock</th><th>Image</th><th>Actions</th></tr></thead>
              <tbody>{data.items.map((item) => (
                <tr key={item._id}>
                  <td data-label="Name">{item.name}</td>
                  <td data-label="Type">{item.type}</td>
                  <td className="amount-cell" data-label="Default price">{formatCurrency(item.defaultPrice)}</td>
                  <td data-label="Stock">{item.stockQty}</td>
                  <td data-label="Image">{item.imageUrl ? <ImagePreview compact src={item.imageUrl} alt={`${item.name} image`} /> : "-"}</td>
                  <td className="table-actions" data-label="Actions"><Link className="btn btn-secondary" to={`/inventory-items/${item._id}/edit`}>Edit</Link><Button variant="danger" onClick={() => deleteMutation.mutate(item._id)} disabled={deleteMutation.isPending && deleteMutation.variables === item._id}>Delete</Button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <Pagination page={data?.page} pages={data?.pages} onPage={setPage} />
      </CollapsiblePanel>
      <ConfirmDialog
        open={Boolean(typeToDelete)}
        title="Delete type"
        message={`Delete "${typeToDelete?.name}"?`}
        onCancel={() => setTypeToDelete(null)}
        onConfirm={() => typeToDelete && deleteTypeMutation.mutate(typeToDelete._id)}
        busy={deleteTypeMutation.isPending}
      />
    </section>
  );
}
