import api from "./axiosInstance";

export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return api.post("/uploads/image", formData).then((res) => res.data);
};

export const uploadInvoiceImage = (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return api.post("/uploads/invoice-image", formData).then((res) => res.data);
};
