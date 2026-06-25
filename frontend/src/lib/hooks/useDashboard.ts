"use client";
import useSWR from "swr";
import { api } from "../api";
import type { DashboardSummary } from "../types";

export function useDashboard() {
  return useSWR<DashboardSummary>("/dashboard/summary", api.getDashboard, {
    refreshInterval: 30_000,
  });
}
