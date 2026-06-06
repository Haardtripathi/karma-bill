import api from "./axiosInstance";

export const getDashboardSummary = () => api.get("/dashboard/summary").then((res) => res.data);
