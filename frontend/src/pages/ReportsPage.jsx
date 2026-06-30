import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronDown, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "../utils/currency.js";
import { formatDate } from "../utils/date.js";
import Button from "../components/common/Button.jsx";
import CollapsiblePanel from "../components/common/CollapsiblePanel.jsx";
import Loader from "../components/common/Loader.jsx";
import SearchBar from "../components/common/SearchBar.jsx";
import DateRangeFilter, { getDateRangeLabel } from "../components/common/DateRangeFilter.jsx";
import useDebounce from "../hooks/useDebounce.js";
import useIsMobile from "../hooks/useIsMobile.js";
import { getSalesReport, getCustomerBalancesReport, getItemSalesReport } from "../api/reportApi.js";
import { statusClass } from "../utils/invoiceStatus.js";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("sales");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const isMobile = useIsMobile();
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
  const activeQuery = activeTab === "sales" ? salesQuery : activeTab === "customers" ? customerQuery : itemsQuery;
  const activeReportTitle = activeTab === "sales" ? "Sales Report" : activeTab === "customers" ? "Customer Balances" : "Item Sales";
  const handleRefresh = async () => {
    await activeQuery.refetch();
    toast.success("Report reloaded");
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Reports</h2>
          <p>View business performance and statistics.</p>
        </div>
      </div>
      
      <CollapsiblePanel className="report-filter-panel" title="Report Filters" summary={activeRangeLabel} defaultOpen={!isMobile}>
        <div className="toolbar-row">
          <SearchBar value={search} onChange={setSearch} placeholder={activeTab === "sales" ? "Search invoices or customers..." : activeTab === "customers" ? "Search customers..." : "Search items..."} />
          <DateRangeFilter label="Report range" startDate={fromDate} endDate={toDate} onChange={({ startDate, endDate }) => { setFromDate(startDate); setToDate(endDate); }} />
        </div>
      </CollapsiblePanel>

      <div className="tabs report-tabs">
        <button className={`btn ${activeTab === "sales" ? "btn-primary" : "btn-secondary"}`} onClick={() => { setActiveTab("sales"); setSearch(""); }}>Sales Report</button>
        <button className={`btn ${activeTab === "customers" ? "btn-primary" : "btn-secondary"}`} onClick={() => { setActiveTab("customers"); setSearch(""); }}>Customer Balances</button>
        <button className={`btn ${activeTab === "items" ? "btn-primary" : "btn-secondary"}`} onClick={() => { setActiveTab("items"); setSearch(""); }}>Item Sales</button>
      </div>

      <CollapsiblePanel
        className="report-results-panel"
        title={activeReportTitle}
        summary={activeQuery.isFetching && activeQuery.data ? "Updating..." : activeRangeLabel}
        actions={<Button variant="secondary" onClick={handleRefresh} disabled={activeQuery.isFetching}><RefreshCw size={15} />{activeQuery.isFetching ? "Reloading" : "Reload"}</Button>}
        defaultOpen
      >
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
                <h4 className="report-subtitle">Recent Invoices</h4>
	                {isMobile ? (
	                  salesQuery.data?.data?.invoices?.length ? (
	                    <div className="record-accordion-list">
	                      {salesQuery.data.data.invoices.slice(0, 50).map(inv => (
	                        <details className="record-accordion" key={inv._id}>
	                          <summary className="record-summary">
	                            <span className="record-summary-main">
	                              <span className="record-title-row">
	                                <span className="record-title">{inv.invoiceCode}</span>
	                                <span className={statusClass(inv.status)}>{inv.status}</span>
	                              </span>
	                              <span className="record-subtitle">{inv.customer?.name || "Walk-in customer"} · {formatDate(inv.invoiceDate)}</span>
	                            </span>
	                            <span className="record-summary-side">
	                              <strong>{formatCurrency(inv.grandTotal)}</strong>
	                              <span>Total</span>
	                            </span>
	                            <ChevronDown className="record-chevron" size={16} aria-hidden="true" />
	                          </summary>
	                          <div className="record-details">
	                            <div className="record-detail-grid">
	                              <div className="record-detail"><span>Invoice</span><strong><Link to={`/invoices/${inv._id}`}>{inv.invoiceCode}</Link></strong></div>
	                              <div className="record-detail"><span>Customer</span><strong>{inv.customer?.customerId ? <Link to={`/customers/${inv.customer.customerId}`}>{inv.customer.name}</Link> : inv.customer?.name || "-"}</strong></div>
	                              <div className="record-detail"><span>Date</span><strong>{formatDate(inv.invoiceDate)}</strong></div>
	                              <div className="record-detail"><span>Grand total</span><strong>{formatCurrency(inv.grandTotal)}</strong></div>
	                              <div className="record-detail"><span>Received</span><strong className="amount-positive">{formatCurrency(inv.receivedAmount)}</strong></div>
	                              <div className="record-detail"><span>Status</span><strong><span className={statusClass(inv.status)}>{inv.status}</span></strong></div>
	                            </div>
	                          </div>
	                        </details>
	                      ))}
	                    </div>
	                  ) : <p className="empty-table-cell">No invoices found.</p>
	                ) : (
	                  <div className="table-responsive desktop-record-table">
	                    <table className="data-table">
	                      <thead>
	                        <tr><th>Date</th><th>Invoice Code</th><th>Customer</th><th>Grand Total</th><th>Received</th><th>Status</th></tr>
	                      </thead>
	                      <tbody>
	                        {salesQuery.data?.data?.invoices?.slice(0, 50).map(inv => (
	                          <tr key={inv._id}>
	                            <td data-label="Date">{formatDate(inv.invoiceDate)}</td>
	                            <td data-label="Invoice"><Link to={`/invoices/${inv._id}`}>{inv.invoiceCode}</Link></td>
	                            <td data-label="Customer">{inv.customer?.customerId ? <Link to={`/customers/${inv.customer.customerId}`}>{inv.customer.name}</Link> : inv.customer?.name}</td>
	                            <td className="amount-cell" data-label="Grand total">{formatCurrency(inv.grandTotal)}</td>
	                            <td className="amount-cell amount-positive" data-label="Received">{formatCurrency(inv.receivedAmount)}</td>
	                            <td data-label="Status"><span className={statusClass(inv.status)}>{inv.status}</span></td>
	                          </tr>
	                        ))}
	                        {(!salesQuery.data?.data?.invoices || salesQuery.data.data.invoices.length === 0) && (
	                          <tr><td className="empty-table-cell" colSpan="6">No invoices found.</td></tr>
	                        )}
	                      </tbody>
	                    </table>
	                  </div>
	                )}
              </>
            )}
          </div>
        )}

        {activeTab === "customers" && (
          <div>
            <div className="report-section-title"><h3>Customer Balances</h3><span>{activeRangeLabel}</span></div>
            {customerQuery.isLoading ? <Loader /> : customerQuery.error ? <p>Error loading balances.</p> : (
	              isMobile ? (
	                customerQuery.data?.data?.length ? (
	                  <div className="record-accordion-list">
	                    {customerQuery.data.data.map(c => (
	                      <details className="record-accordion" key={c.customerId}>
	                        <summary className="record-summary">
	                          <span className="record-summary-main">
	                            <span className="record-title-row"><span className="record-title">{c.name}</span></span>
	                            <span className="record-subtitle">{c.phone || "No phone"}</span>
	                          </span>
	                          <span className="record-summary-side">
	                            <strong>{formatCurrency(c.outstandingBalance)}</strong>
	                            <span>Due</span>
	                          </span>
	                          <ChevronDown className="record-chevron" size={16} aria-hidden="true" />
	                        </summary>
	                        <div className="record-details">
	                          <div className="record-detail-grid">
	                            <div className="record-detail"><span>Name</span><strong><Link to={`/customers/${c.customerId}`}>{c.name}</Link></strong></div>
	                            <div className="record-detail"><span>Phone</span><strong>{c.phone || "-"}</strong></div>
	                            <div className="record-detail"><span>Total billed</span><strong>{formatCurrency(c.totalBilled)}</strong></div>
	                            <div className="record-detail"><span>Total paid</span><strong className="amount-positive">{formatCurrency(c.totalPaid)}</strong></div>
	                            <div className="record-detail"><span>Outstanding</span><strong className="amount-balance">{formatCurrency(c.outstandingBalance)}</strong></div>
	                          </div>
	                        </div>
	                      </details>
	                    ))}
	                  </div>
	                ) : <p className="empty-table-cell">No customers with outstanding balances.</p>
	              ) : (
	                <div className="table-responsive desktop-record-table">
	                  <table className="data-table">
	                    <thead>
	                      <tr><th>Name</th><th>Phone</th><th>Total Billed</th><th>Total Paid</th><th>Outstanding Balance</th></tr>
	                    </thead>
	                    <tbody>
	                      {customerQuery.data?.data?.map(c => (
	                        <tr key={c.customerId}>
	                          <td data-label="Name"><Link to={`/customers/${c.customerId}`}>{c.name}</Link></td>
	                          <td data-label="Phone">{c.phone}</td>
	                          <td className="amount-cell" data-label="Total billed">{formatCurrency(c.totalBilled)}</td>
	                          <td className="amount-cell amount-positive" data-label="Total paid">{formatCurrency(c.totalPaid)}</td>
	                          <td className="amount-cell amount-balance" data-label="Outstanding"><strong>{formatCurrency(c.outstandingBalance)}</strong></td>
	                        </tr>
	                      ))}
	                      {(!customerQuery.data?.data || customerQuery.data.data.length === 0) && (
	                        <tr><td className="empty-table-cell" colSpan="5">No customers with outstanding balances.</td></tr>
	                      )}
	                    </tbody>
	                  </table>
	                </div>
	              )
            )}
          </div>
        )}

        {activeTab === "items" && (
          <div>
            <div className="report-section-title"><h3>Item Sales</h3><span>{activeRangeLabel}</span></div>
            {itemsQuery.isLoading ? <Loader /> : itemsQuery.error ? <p>Error loading item sales.</p> : (
	              isMobile ? (
	                itemsQuery.data?.data?.length ? (
	                  <div className="record-accordion-list">
	                    {itemsQuery.data.data.map(item => (
	                      <details className="record-accordion" key={item.itemId || item.itemName}>
	                        <summary className="record-summary">
	                          <span className="record-summary-main">
	                            <span className="record-title-row"><span className="record-title">{item.itemName}</span></span>
	                            <span className="record-subtitle">{item.quantitySold} sold</span>
	                          </span>
	                          <span className="record-summary-side">
	                            <strong>{formatCurrency(item.totalRevenue)}</strong>
	                            <span>Revenue</span>
	                          </span>
	                          <ChevronDown className="record-chevron" size={16} aria-hidden="true" />
	                        </summary>
	                        <div className="record-details">
	                          <div className="record-detail-grid">
	                            <div className="record-detail"><span>Item</span><strong>{item.itemName}</strong></div>
	                            <div className="record-detail"><span>Quantity sold</span><strong>{item.quantitySold}</strong></div>
	                            <div className="record-detail"><span>Total revenue</span><strong>{formatCurrency(item.totalRevenue)}</strong></div>
	                          </div>
	                        </div>
	                      </details>
	                    ))}
	                  </div>
	                ) : <p className="empty-table-cell">No item sales recorded.</p>
	              ) : (
	                <div className="table-responsive desktop-record-table">
	                  <table className="data-table">
	                    <thead>
	                      <tr><th>Item Name</th><th>Quantity Sold</th><th>Total Revenue</th></tr>
	                    </thead>
	                    <tbody>
	                      {itemsQuery.data?.data?.map(item => (
	                        <tr key={item.itemId || item.itemName}>
	                          <td data-label="Item">{item.itemName}</td>
	                          <td data-label="Quantity sold">{item.quantitySold}</td>
	                          <td className="amount-cell" data-label="Revenue">{formatCurrency(item.totalRevenue)}</td>
	                        </tr>
	                      ))}
	                      {(!itemsQuery.data?.data || itemsQuery.data.data.length === 0) && (
	                        <tr><td className="empty-table-cell" colSpan="3">No item sales recorded.</td></tr>
	                      )}
	                    </tbody>
	                  </table>
	                </div>
	              )
            )}
          </div>
        )}
      </CollapsiblePanel>
    </section>
  );
}
