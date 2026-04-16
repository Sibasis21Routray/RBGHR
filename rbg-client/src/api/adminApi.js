import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URI}/admin`, // backend base URL
});

// Dashboard stats
export const getStats = () => API.get("/stats");

// Sub-admin APIs
export const getSubAdmins = () => API.get("/sub-admins");
export const createSubAdmin = (data) => API.post("/sub-admins", data);
export const updateSubAdmin = (id, data) => API.put(`/sub-admins/${id}`, data);
export const deleteSubAdmin = (id) => API.delete(`/sub-admins/${id}`);

// Sub-user APIs
export const getSubUsers = () => API.get("/sub-users");
export const createSubUser = (data) => API.post("/sub-users", data);
export const updateSubUser = (id, data) => API.put(`/sub-users/${id}`, data);
export const deleteSubUser = (id) => API.delete(`/sub-users/${id}`);

// Create user API
export const createUser = (data) => API.post("/create-user", data);
