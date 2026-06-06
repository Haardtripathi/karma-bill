import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../components/common/Button.jsx";
import SearchBar from "../components/common/SearchBar.jsx";
import Loader from "../components/common/Loader.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import Pagination from "../components/common/Pagination.jsx";
import useDebounce from "../hooks/useDebounce.js";
import { deleteCustomer, getCustomers } from "../api/customerApi.js";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["customers", debounced, page], queryFn: () => getCustomers({ search: debounced, page, limit: 10 }) });
  const deleteMutation = useMutation({ mutationFn: deleteCustomer, onSuccess: () => { toast.success("Customer deleted"); queryClient.invalidateQueries({ queryKey: ["customers"] }); } });

  return (
    <section className="page">
      <div className="page-header">
        <div><h2>Customers</h2><p>Search by name, phone, or vehicle number.</p></div>
        <Link className="btn btn-primary" to="/customers/new">Add customer</Link>
      </div>
      <div className="panel page">
        <SearchBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search customers" />
        {isLoading ? <Loader /> : !data?.items?.length ? <EmptyState title="No customers found" /> : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Phone</th><th>Vehicle number</th><th>Address</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{data.items.map((customer) => (
                <tr key={customer._id}>
                  <td><Link to={`/customers/${customer._id}`}>{customer.name}</Link></td><td>{customer.phone}</td><td>{customer.vehicleNumber}</td><td>{customer.address}</td><td>{customer.isActive ? "Active" : "Inactive"}</td>
                  <td className="table-actions"><Link className="btn btn-secondary" to={`/customers/${customer._id}`}>View</Link><Link className="btn btn-secondary" to={`/customers/${customer._id}/edit`}>Edit</Link><Button variant="danger" onClick={() => deleteMutation.mutate(customer._id)}>Delete</Button></td>
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
