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
