"use client";
import { useState, useEffect } from "react";
import { usePayments } from "@/lib/hooks/usePayments";
import { ActStatusBadge } from "./ActStatusBadge";
import type { Act } from "@/lib/types";

interface Props {
  filters: Record<string, string>;
}

function formatAmount(amount: string) {
  return Number(amount).toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₽";
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

export function PaymentsTable({ filters }: Props) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = usePayments({ ...filters, page: String(page), size: "20" });
  const [actOverrides, setActOverrides] = useState<Record<string, Act>>({});

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const handleActUpdate = (paymentId: string, updated: Act) => {
    setActOverrides((prev) => ({ ...prev, [paymentId]: updated }));
  };

  if (error) {
    return (
      <div className="rounded-xl p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
        Ошибка загрузки: {error.message}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Дата
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Сумма
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Назначение
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Этап
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Статус акта
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {isLoading && !data ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(5)].map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">
                  Платежи не найдены
                </td>
              </tr>
            ) : (
              data?.items.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-700 font-mono text-xs whitespace-nowrap">
                    {formatDate(payment.payment_date)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                    {formatAmount(payment.amount)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                    {payment.payment_purpose ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {payment.service_stage ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <ActStatusBadge
                      paymentId={payment.id}
                      act={actOverrides[payment.id] ?? payment.act}
                      onUpdate={handleActUpdate}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Показано {data.items.length} из {data.total} записей
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Назад
            </button>
            <span className="px-3 py-1 text-xs text-gray-600">
              {page} / {data.pages}
            </span>
            <button
              disabled={page >= data.pages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Вперёд →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
