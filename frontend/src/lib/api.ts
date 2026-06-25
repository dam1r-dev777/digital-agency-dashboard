import type { Act, DashboardSummary, Payment, PaymentListResponse, Project } from "./types";

const BASE = "/api/v1";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getDashboard: (): Promise<DashboardSummary> =>
    fetchJSON(`${BASE}/dashboard/summary`),

  getPayments: (params: Record<string, string>): Promise<PaymentListResponse> => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ""))
    ).toString();
    return fetchJSON(`${BASE}/payments${qs ? `?${qs}` : ""}`);
  },

  getProjects: (): Promise<Project[]> =>
    fetchJSON(`${BASE}/projects`),

  updateActStatus: (
    actId: string,
    payload: { is_sent?: boolean; is_signed?: boolean; manager_comment?: string }
  ): Promise<Act> =>
    fetchJSON(`${BASE}/acts/${actId}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  createAct: (paymentId: string): Promise<Act> =>
    fetchJSON(`${BASE}/payments/${paymentId}/acts`, { method: "POST" }),
};
