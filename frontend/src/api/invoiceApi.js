import api from "./axiosInstance";

export const getInvoices = (params = {}) => api.get("/invoices", { params }).then((res) => res.data);
export const getInvoice = (id) => api.get(`/invoices/${id}`).then((res) => res.data);
export const getInvoicePrintData = (id) => api.get(`/invoices/${id}/print-data`).then((res) => res.data);
export const createInvoice = (payload) => api.post("/invoices", payload).then((res) => res.data);
export const updateInvoice = ({ id, payload }) => api.put(`/invoices/${id}`, payload).then((res) => res.data);
export const deleteInvoice = (id) => api.delete(`/invoices/${id}`).then((res) => res.data);
export const cancelInvoice = (id) => api.patch(`/invoices/${id}/cancel`).then((res) => res.data);
export const addInvoicePayment = ({ id, payload }) => api.post(`/invoices/${id}/payments`, payload).then((res) => res.data);
export const generateInvoicePdf = (id) => api.post(`/invoices/${id}/generate-pdf`).then((res) => res.data);
export const sendInvoiceWhatsapp = (id) => api.post(`/invoices/${id}/send-whatsapp`).then((res) => res.data);
export const invoicePdfUrl = (id) => `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api"}/invoices/${id}/pdf`;
