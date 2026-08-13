"use client";

import { useState } from "react";

/**
 * Botão para ações destrutivas (excluir, substituir lista, arquivar).
 * Especificação, seção 58: nunca usar confirmação genérica ("Tem certeza?"),
 * sempre explicar exatamente o que vai acontecer.
 */
export function ConfirmButton({
  label,
  title,
  message,
  confirmLabel = "Confirmar",
  variant = "danger",
  onConfirm,
  className,
}: {
  label: string;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => Promise<void> | void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir a ação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          `rounded-md border px-3 py-1.5 text-sm font-medium ${
            variant === "danger"
              ? "border-red-300 text-red-700 hover:bg-red-50"
              : "border-parish-300 text-parish-700 hover:bg-parish-50"
          }`
        }
      >
        {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-parish-950/50 px-4"
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 id="confirm-dialog-title" className="text-lg font-semibold text-parish-900">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-parish-700">{message}</p>
            {error && (
              <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-md border border-parish-300 px-4 py-2 text-sm font-medium text-parish-700 hover:bg-parish-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
                  variant === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-parish-800 hover:bg-parish-900"
                } disabled:opacity-60`}
              >
                {loading ? "Processando..." : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
