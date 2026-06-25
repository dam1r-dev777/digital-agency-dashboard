"use client";
import { useDashboard } from "@/lib/hooks/useDashboard";

function MetricCard({
  label,
  value,
  sub,
  variant = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  variant?: "default" | "danger" | "warning" | "success";
}) {
  const variants = {
    default: "bg-white border-gray-100",
    danger: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
    success: "bg-green-50 border-green-200",
  };
  const textVariants = {
    default: "text-gray-900",
    danger: "text-red-600",
    warning: "text-yellow-700",
    success: "text-green-700",
  };

  return (
    <div className={`rounded-xl p-5 shadow-sm border ${variants[variant]}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-2 ${textVariants[variant]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export function SummaryWidget() {
  const { data, isLoading, error } = useDashboard();

  if (error) {
    return (
      <div className="rounded-xl p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
        Не удалось загрузить сводку: {error.message}
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl p-5 border border-gray-100 bg-gray-50 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  const fmt = (n: string | number) =>
    Number(n).toLocaleString("ru-RU", { maximumFractionDigits: 0 });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard
        label="Всего платежей"
        value={String(data.total_payments)}
        sub={`на сумму ${fmt(data.total_amount)} ₽`}
      />
      <MetricCard
        label="Требует внимания"
        value={String(data.requires_attention_count)}
        sub={`${fmt(data.amount_by_status?.REQUIRES_ATTENTION ?? 0)} ₽`}
        variant="danger"
      />
      <MetricCard
        label="Ожидают подписи"
        value={String(data.count_by_status.AWAITING_SIGNATURE)}
        sub={`${fmt(data.amount_by_status?.AWAITING_SIGNATURE ?? 0)} ₽`}
        variant="warning"
      />
      <MetricCard
        label="Закрыто"
        value={String(data.count_by_status.CLOSED)}
        sub={`${fmt(data.amount_by_status?.CLOSED ?? 0)} ₽`}
        variant="success"
      />
    </div>
  );
}
