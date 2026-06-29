import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../components/common/Button.jsx";
import Select from "../components/common/Select.jsx";
import SearchBar from "../components/common/SearchBar.jsx";
import Loader from "../components/common/Loader.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import Pagination from "../components/common/Pagination.jsx";
import ImagePreview from "../components/common/ImagePreview.jsx";
import useDebounce from "../hooks/useDebounce.js";
import { deleteInventoryItem, getInventoryItems } from "../api/inventoryItemApi.js";
import { formatCurrency } from "../utils/currency.js";

export default function InventoryItemsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["inventory-items", debounced, type, page], queryFn: () => getInventoryItems({ search: debounced, type, page, limit: 10 }) });
  const deleteMutation = useMutation({ mutationFn: deleteInventoryItem, onSuccess: () => { toast.success("Item deleted"); queryClient.invalidateQueries({ queryKey: ["inventory-items"] }); } });

  return (
    <section className="page">
      <div className="page-header"><div><h2>Inventory Items</h2><p>Parts, services and other billable items.</p></div><Link className="btn btn-primary" to="/inventory-items/new">Add item</Link></div>
      <div className="panel page">
        <div className="toolbar-row">
          <SearchBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search items" />
          <Select label="Filter by type" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">All</option><option value="service">service</option><option value="part">part</option><option value="other">other</option>
          </Select>
        </div>
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
      </div>
    </section>
  );
}
