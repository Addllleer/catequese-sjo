"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "number" | "checkbox" | "select" | "textarea" | "date" | "time" | "email" | "password";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  help?: string;
}

/**
 * Formulário genérico usado pelas telas administrativas mais simples
 * (Comunidades, Salas, descrição de Nível, Avisos, Usuários). Envia os
 * valores como JSON para a rota de API informada e atualiza a página com
 * router.refresh() após sucesso — o servidor permanece a única fonte de
 * verdade e revalida a permissão em cada chamada.
 */
export function AdminEntityForm({
  fields,
  initialValues,
  fixedValues,
  submitLabel,
  method,
  action,
  onSuccess,
  onCancel,
}: {
  fields: FieldConfig[];
  initialValues?: Record<string, any>;
  fixedValues?: Record<string, any>;
  submitLabel: string;
  method: "POST" | "PATCH";
  action: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, any>>(initialValues ?? {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(name: string, value: any) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, any> = { ...fixedValues };
      for (const f of fields) {
        let v = values[f.name];
        if (f.type === "number" && v !== undefined && v !== "") v = Number(v);
        if (f.type === "checkbox") v = Boolean(v);
        payload[f.name] = v === "" ? null : v;
      }

      const res = await fetch(action, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Não foi possível salvar. Verifique os dados informados.");
      }

      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((f) => (
        <div key={f.name}>
          {f.type !== "checkbox" && (
            <label htmlFor={f.name} className="block text-sm font-medium text-parish-800">
              {f.label}
              {f.required && <span className="text-red-600"> *</span>}
            </label>
          )}

          {f.type === "select" ? (
            <select
              id={f.name}
              required={f.required}
              value={values[f.name] ?? ""}
              onChange={(e) => setField(f.name, e.target.value)}
              className="mt-1 w-full rounded-md border border-parish-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Selecione...</option>
              {f.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : f.type === "textarea" ? (
            <textarea
              id={f.name}
              required={f.required}
              placeholder={f.placeholder}
              value={values[f.name] ?? ""}
              onChange={(e) => setField(f.name, e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-md border border-parish-300 px-3 py-2 text-sm"
            />
          ) : f.type === "checkbox" ? (
            <label className="flex items-center gap-2 text-sm font-medium text-parish-800">
              <input
                type="checkbox"
                checked={Boolean(values[f.name])}
                onChange={(e) => setField(f.name, e.target.checked)}
                className="h-4 w-4 rounded border-parish-300"
              />
              {f.label}
            </label>
          ) : (
            <input
              id={f.name}
              type={f.type}
              required={f.required}
              placeholder={f.placeholder}
              value={values[f.name] ?? ""}
              onChange={(e) => setField(f.name, e.target.value)}
              className="mt-1 w-full rounded-md border border-parish-300 px-3 py-2 text-sm"
            />
          )}
          {f.help && <p className="mt-1 text-xs text-parish-500">{f.help}</p>}
        </div>
      ))}

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-parish-800 px-4 py-2 text-sm font-medium text-white hover:bg-parish-900 disabled:opacity-60"
        >
          {loading ? "Salvando..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-parish-300 px-4 py-2 text-sm font-medium text-parish-700 hover:bg-parish-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
