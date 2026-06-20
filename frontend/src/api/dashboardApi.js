import api from "./axiosInstance";

export const getDashboardSummary = (params = {}) => api.get("/dashboard/summary", { params }).then((res) => res.data);
