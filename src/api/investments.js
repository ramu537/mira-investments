import { apiRequest } from "./client";

export const investmentApi = {
  list() {
    return apiRequest("/investments");
  },
  create(holding) {
    return apiRequest("/investments", { method: "POST", body: JSON.stringify(holding) });
  },
  update(id, holding) {
    return apiRequest(`/investments/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(holding) });
  },
  remove(id) {
    return apiRequest(`/investments/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};

