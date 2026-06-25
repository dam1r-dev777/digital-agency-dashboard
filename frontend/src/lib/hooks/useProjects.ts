"use client";
import useSWR from "swr";
import { api } from "../api";
import type { Project } from "../types";

export function useProjects() {
  return useSWR<Project[]>("/projects", api.getProjects);
}
