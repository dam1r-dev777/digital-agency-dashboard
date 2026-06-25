"use client";
import { useState } from "react";
import { useProjects } from "@/lib/hooks/useProjects";
import type { ActStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: ActStatus | ""; label: string }[] = [
  { value: "", label: "Все статусы" },
  { value: "NOT_SENT", label: "Не отправлен" },
  { value: "AWAITING_SIGNATURE", label: "Ожидает подписи" },
  { value: "CLOSED", label: "Закрыт" },
  { value: "REQUIRES_ATTENTION", label: "Требует внимания" },
];

interface Filters {
  date_from: string;
  date_to: string;
  project_id: string;
  status: string;
  search: string;
}

interface Props {
  onChange: (filters: Record<string, string>) => void;
}

export function FilterPanel({ onChange }: Props) {
  const { data: projects } = useProjects();
  const [filters, setFilters] = useState<Filters>({
    date_from: "",
    date_to: "",
    project_id: "",
    status: "",
    search: "",
  });

  const update = (key: keyof Filters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    const active = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== ""));
    onChange(active);
  };

  const reset = () => {
    const empty: Filters = { date_from: "", date_to: "", project_id: "", status: "", search: "" };
    setFilters(empty);
    onChange({});
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Поиск</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
            placeholder="Назначение или клиент..."
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[200px]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Дата от</label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => update("date_from", e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Дата до</label>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => update("date_to", e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Проект</label>
          <select
            value={filters.project_id}
            onChange={(e) => update("project_id", e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[180px]"
          >
            <option value="">Все проекты</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Статус акта</label>
          <select
            value={filters.status}
            onChange={(e) => update("status", e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[180px]"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <button
            onClick={reset}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Сбросить
          </button>
        )}
      </div>
    </div>
  );
}
