"use client";
import { useState } from "react";
import { SummaryWidget } from "./SummaryWidget";
import { FilterPanel } from "./FilterPanel";
import { PaymentsTable } from "./PaymentsTable";

export function DashboardClient() {
  const [filters, setFilters] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      <SummaryWidget />
      <FilterPanel onChange={setFilters} />
      <PaymentsTable filters={filters} />
    </div>
  );
}
