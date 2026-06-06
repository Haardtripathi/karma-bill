import api from "./axiosInstance";

export const getSalesReport = (params = {}) => api.get("/reports/sales", { params });
export const getCustomerBalancesReport = (params = {}) => api.get("/reports/customers", { params });
export const getItemSalesReport = (params = {}) => api.get("/reports/items", { params });
