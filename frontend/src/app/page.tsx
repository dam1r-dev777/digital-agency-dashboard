import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Платёжный дашборд</h1>
        <p className="text-sm text-gray-500 mt-1">
          Контроль платежей и статусов закрывающих документов
        </p>
      </div>
      <DashboardClient />
    </main>
  );
}
