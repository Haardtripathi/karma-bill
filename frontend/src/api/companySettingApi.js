import api from "./axiosInstance";

export const getCompanySettings = () => api.get("/company-settings").then((res) => res.data);
export const updateCompanySettings = (payload) => api.put("/company-settings", payload).then((res) => res.data);
export const uploadCompanyLogo = (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return api.post("/company-settings/logo", formData).then((res) => res.data);
};
export const uploadCompanySignature = (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return api.post("/company-settings/signature", formData).then((res) => res.data);
};
