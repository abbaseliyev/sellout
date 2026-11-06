import apiClient from "./client.js";

export async function login(credentials) {
  const { data } = await apiClient.post("/auth/token", credentials);
  return data;
}
