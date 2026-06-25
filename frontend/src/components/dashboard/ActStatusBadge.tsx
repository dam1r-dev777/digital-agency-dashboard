"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Act, ActStatus } from "@/lib/types";

const STATUS_COLORS: Record<ActStatus, string> = {
  NOT_SENT: "bg-gray-100 text-gray-700 border-gray-200",
  AWAITING_SIGNATURE: "bg-yellow-50 text-yellow-800 border-yellow-200",
  CLOSED: "bg-green-50 text-green-800 border-green-200",
  REQUIRES_ATTENTION: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<ActStatus, string> = {
  NOT_SENT: "Не отправлен",
  AWAITING_SIGNATURE: "Ожидает подписи",
  CLOSED: "Закрыт",
  REQUIRES_ATTENTION: "Требует внимания",
};

interface Props {
  paymentId: string;
  act: Act | null;
  onUpdate: (paymentId: string, updated: Act) => void;
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
      <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L2.226 11.3a2.25 2.25 0 0 0-.59 1.099l-.51 2.225a.75.75 0 0 0 .91.91l2.224-.51a2.25 2.25 0 0 0 1.1-.59l8.787-8.787a1.75 1.75 0 0 0 0-2.475Z" />
    </svg>
  );
}

export function ActStatusBadge({ paymentId, act, onUpdate }: Props) {
  const [localAct, setLocalAct] = useState<Act | null>(act);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState(false);
  const [commentValue, setCommentValue] = useState(act?.manager_comment ?? "");
  const [savingComment, setSavingComment] = useState(false);

  const status: ActStatus = localAct?.status ?? "NOT_SENT";

  const handlePatch = async (patch: { is_sent?: boolean; is_signed?: boolean }) => {
    if (!localAct) return;
    const prev = localAct;
    setLocalAct({ ...localAct, ...patch });
    setLoading(true);
    setError(null);
    try {
      const updated = await api.updateActStatus(localAct.id, patch);
      setLocalAct(updated);
      onUpdate(paymentId, updated);
    } catch {
      setLocalAct(prev);
      setError("Ошибка обновления");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndSend = async () => {
    setLoading(true);
    setError(null);
    try {
      const created = await api.createAct(paymentId);
      setLocalAct(created);
      setCommentValue(created.manager_comment ?? "");
      onUpdate(paymentId, created);
    } catch {
      setError("Ошибка отправки акта");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveComment = async () => {
    if (!localAct) return;
    setSavingComment(true);
    setError(null);
    try {
      const updated = await api.updateActStatus(localAct.id, { manager_comment: commentValue });
      setLocalAct(updated);
      onUpdate(paymentId, updated);
      setEditingComment(false);
    } catch {
      setError("Ошибка сохранения");
    } finally {
      setSavingComment(false);
    }
  };

  const hasComment = !!localAct?.manager_comment;

  return (
    <div className="flex flex-col gap-1 min-w-[160px]">
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status]}`}
        >
          {status === "REQUIRES_ATTENTION" && <span className="mr-1">⚠</span>}
          {STATUS_LABELS[status]}
        </span>
        {localAct && (
          <button
            onClick={() => {
              setCommentValue(localAct.manager_comment ?? "");
              setEditingComment((v) => !v);
            }}
            title={hasComment ? `Комментарий: ${localAct.manager_comment}` : "Добавить комментарий"}
            className={`transition-colors hover:text-blue-500 ${hasComment ? "text-blue-400" : "text-gray-300"}`}
          >
            <PencilIcon />
          </button>
        )}
      </div>

      {!localAct && (
        <button
          disabled={loading}
          onClick={handleCreateAndSend}
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-40 text-left"
        >
          {loading ? "..." : "→ Отправить акт"}
        </button>
      )}
      {localAct && !localAct.is_sent && (
        <button
          disabled={loading}
          onClick={() => handlePatch({ is_sent: true })}
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-40 text-left"
        >
          {loading ? "..." : "→ Отправить акт"}
        </button>
      )}
      {localAct && localAct.is_sent && !localAct.is_signed && (
        <button
          disabled={loading}
          onClick={() => handlePatch({ is_signed: true })}
          className="text-xs text-green-600 hover:text-green-800 hover:underline disabled:opacity-40 text-left"
        >
          {loading ? "..." : "✓ Подписать акт"}
        </button>
      )}

      {error && <span className="text-xs text-red-500">{error}</span>}

      {editingComment && localAct && (
        <div className="mt-0.5 flex flex-col gap-1">
          <textarea
            value={commentValue}
            onChange={(e) => setCommentValue(e.target.value)}
            rows={2}
            placeholder="Комментарий к акту..."
            className="text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none w-full"
          />
          <div className="flex gap-1">
            <button
              disabled={savingComment}
              onClick={handleSaveComment}
              className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40"
            >
              {savingComment ? "..." : "Сохранить"}
            </button>
            <button
              onClick={() => {
                setEditingComment(false);
                setCommentValue(localAct.manager_comment ?? "");
              }}
              className="text-xs px-2 py-0.5 border border-gray-200 rounded text-gray-500 hover:bg-gray-50"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
