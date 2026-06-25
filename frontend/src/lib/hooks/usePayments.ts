"use client";
import useSWR from "swr";
import { api } from "../api";
import type { PaymentListResponse } from "../types";

export function usePayments(filters: Record<string, string>) {
  const key = JSON.stringify({ path: "/payments", filters });
  return useSWR<PaymentListResponse>(
    key,
    () => api.getPayments(filters),
    { keepPreviousData: true }
  );
}
