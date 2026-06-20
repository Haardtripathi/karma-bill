import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { formatCurrency } from "../utils/currency.js";
import { formatDate } from "../utils/date.js";
import Loader from "../components/common/Loader.jsx";
import SearchBar from "../components/common/SearchBar.jsx";
import DateRangeFilter, { getDateRangeLabel } from "../components/common/DateRangeFilter.jsx";
import useDebounce from "../hooks/useDebounce.js";
import { getSalesReport, getCustomerBalancesReport, getItemSalesReport } from "../api/reportApi.js";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("sales");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const debouncedSearch = useDebounce(search);
  const activeRangeLabel = getDateRangeLabel(fromDate, toDate);

  const salesQuery = useQuery({
    queryKey: ["reports", "sales", debouncedSearch, fromDate, toDate],
    queryFn: () => getSalesReport({ search: debouncedSearch, startDate: fromDate, endDate: toDate }),
    enabled: activeTab === "sales"
  });

  const customerQuery = useQuery({
    queryKey: ["reports", "customers", debouncedSearch, fromDate, toDate],
    queryFn: () => getCustomerBalancesReport({ search: debouncedSearch, startDate: fromDate, endDate: toDate }),
    enabled: activeTab === "customers"
  });

  const itemsQuery = useQuery({
    queryKey: ["reports", "items", debouncedSearch, fromDate, toDate],
    queryFn: () => getItemSalesReport({ search: debouncedSearch, startDate: fromDate, endDate: toDate }),
    enabled: activeTab === "items"
  });

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Reports</h2>
          <p>View business performance and statistics.</p>
        </div>
      </div>
      
      <div className="panel" style={{ marginBottom: "1rem" }}>
        <div className="toolbar-row">
          <SearchBar value={search} onChange={setSearch} placeholder={activeTab === "sales" ? "Search invoices or customers..." : activeTab === "customers" ? "Search customers..." : "Search items..."} />
          <DateRangeFilter label="Report range" startDate={fromDate} endDate={toDate} onChange={({ startDate, endDate }) => { setFromDate(startDate); setToDate(endDate); }} />
        </div>
      </div>

      <div className="tabs">
        <button className={`btn ${activeTab === "sales" ? "btn-primary" : "btn-secondary"}`} onClick={() => { setActiveTab("sales"); setSearch(""); }}>Sales Report</button>
        <button className={`btn ${activeTab === "customers" ? "btn-primary" : "btn-secondary"}`} onClick={() => { setActiveTab("customers"); setSearch(""); }} style={{ marginLeft: "10px" }}>Customer Balances</button>
        <button className={`btn ${activeTab === "items" ? "btn-primary" : "btn-secondary"}`} onClick={() => { setActiveTab("items"); setSearch(""); }} style={{ marginLeft: "10px" }}>Item Sales</button>
      </div>

      <div className="panel" style={{ marginTop: "1.5rem" }}>
        {activeTab === "sales" && (
          <div>
            <div className="report-section-title"><h3>Sales Overview</h3><span>{activeRangeLabel}</span></div>
            {salesQuery.isLoading ? <Loader /> : salesQuery.error ? <p>Error loading sales.</p> : (
              <>
                <div className="dashboard-grid">
                  <div className="stat-card">
                    <div className="stat-value">{formatCurrency(salesQuery.data?.data?.summary?.totalBilled)}</div>
                    <div className="stat-label">Total Revenue</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{formatCurrency(salesQuery.data?.data?.summary?.totalReceived)}</div>
                    <div className="stat-label">Total Received</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{formatCurrency(salesQuery.data?.data?.summary?.outstandingBalance)}</div>
                    <div className="stat-label">Outstanding Balance</div>
                  </div>
                </div>
                <h4 style={{ marginTop: "2rem", marginBottom: "1rem" }}>Recent Invoices</h4>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr><th>Date</th><th>Invoice Code</th><th>Customer</th><th>Grand Total</th><th>Received</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {salesQuery.data?.data?.invoices?.slice(0, 50).map(inv => (
                        <tr key={inv._id}>
                          <td>{formatDate(inv.invoiceDate)}</td>
                          <td><Link to={`/invoices/${inv._id}`}>{inv.invoiceCode}</Link></td>
                          <td>{inv.customer?.customerId ? <Link to={`/customers/${inv.customer.customerId}`}>{inv.customer.name}</Link> : inv.customer?.name}</td>
                          <td>{formatCurrency(inv.grandTotal)}</td>
                          <td>{formatCurrency(inv.receivedAmount)}</td>
                          <td>{inv.status}</td>
                        </tr>
                      ))}
                      {(!salesQuery.data?.data?.invoices || salesQuery.data.data.invoices.length === 0) && (
                        <tr><td colSpan="6" style={{ textAlign: "center", padding: "1rem" }}>No invoices found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "customers" && (
          <div>
            <div className="report-section-title"><h3>Customer Balances</h3><span>{activeRangeLabel}</span></div>
            {customerQuery.isLoading ? <Loader /> : customerQuery.error ? <p>Error loading balances.</p> : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr><th>Name</th><th>Phone</th><th>Total Billed</th><th>Total Paid</th><th>Outstanding Balance</th></tr>
                  </thead>
                  <tbody>
                    {customerQuery.data?.data?.map(c => (
                      <tr key={c.customerId}>
                        <td><Link to={`/customers/${c.customerId}`}>{c.name}</Link></td>
                        <td>{c.phone}</td>
                        <td>{formatCurrency(c.totalBilled)}</td>
                        <td>{formatCurrency(c.totalPaid)}</td>
                        <td><strong>{formatCurrency(c.outstandingBalance)}</strong></td>
                      </tr>
                    ))}
                    {(!customerQuery.data?.data || customerQuery.data.data.length === 0) && (
                      <tr><td colSpan="5" style={{ textAlign: "center", padding: "1rem" }}>No customers with outstanding balances.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "items" && (
          <div>
            <div className="report-section-title"><h3>Item Sales</h3><span>{activeRangeLabel}</span></div>
            {itemsQuery.isLoading ? <Loader /> : itemsQuery.error ? <p>Error loading item sales.</p> : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr><th>Item Name</th><th>Quantity Sold</th><th>Total Revenue</th></tr>
                  </thead>
                  <tbody>
                    {itemsQuery.data?.data?.map(item => (
                      <tr key={item.itemId || item.itemName}>
                        <td>{item.itemName}</td>
                        <td>{item.quantitySold}</td>
                        <td>{formatCurrency(item.totalRevenue)}</td>
                      </tr>
                    ))}
                    {(!itemsQuery.data?.data || itemsQuery.data.data.length === 0) && (
                      <tr><td colSpan="3" style={{ textAlign: "center", padding: "1rem" }}>No item sales recorded.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
