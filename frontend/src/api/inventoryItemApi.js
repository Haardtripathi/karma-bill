import api from "./axiosInstance";

export const getInventoryItems = (params = {}) => api.get("/inventory-items", { params }).then((res) => res.data);
export const getInventoryItem = (id) => api.get(`/inventory-items/${id}`).then((res) => res.data);
export const createInventoryItem = (payload) => api.post("/inventory-items", payload).then((res) => res.data);
export const updateInventoryItem = ({ id, payload }) => api.put(`/inventory-items/${id}`, payload).then((res) => res.data);
export const deleteInventoryItem = (id) => api.delete(`/inventory-items/${id}`).then((res) => res.data);
export const uploadInventoryItemImage = ({ id, file }) => {
  const formData = new FormData();
  formData.append("image", file);
  return api.post(`/inventory-items/${id}/image`, formData).then((res) => res.data);
};

export const getInventoryItemTypes = (params = {}) => api.get("/inventory-item-types", { params }).then((res) => res.data);
export const getInventoryItemType = (id) => api.get(`/inventory-item-types/${id}`).then((res) => res.data);
export const createInventoryItemType = (payload) => api.post("/inventory-item-types", payload).then((res) => res.data);
export const updateInventoryItemType = ({ id, payload }) => api.put(`/inventory-item-types/${id}`, payload).then((res) => res.data);
export const deleteInventoryItemType = (id) => api.delete(`/inventory-item-types/${id}`).then((res) => res.data);
