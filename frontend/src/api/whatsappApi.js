import api from "./axiosInstance";

export const sendInvoiceWhatsapp = (invoiceId) => api.post(`/whatsapp/send-invoice/${invoiceId}`).then((res) => res.data);
