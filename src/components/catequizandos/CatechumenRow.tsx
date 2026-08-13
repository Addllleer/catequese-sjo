"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmButton } from "@/components/ConfirmButton";
import { formatDateBR, formatDateInputValue } from "@/lib/format";

export interface CatechumenData {
  id: string;
  name: string;
  birthDate: string; // ISO
  baptized: boolean;
  firstEucharist: boolean;
  confirmed: boolean;
}

export function CatechumenRow({ catechumen }: { catechumen: CatechumenData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(catechumen.name);
  const [birthDate, setBirthDate] = useState(formatDateInputValue(catechumen.birthDate));
  const [baptized, setBaptized] = useState(catechumen.baptized);
  const [firstEucharist, setFirstEucharist] = useState(catechumen.firstEucharist);
  const [confirmed, setConfirmed] = useState(catechumen.confirmed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/catequizandos/${catechumen.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, birthDate, baptized, firstEucharist, confirmed }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Não foi possível salvar.");
      }
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/catequizandos/${catechumen.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Não foi possível excluir.");
    }
    router.refresh();
  }

  if (editing) {
    return (
      <tr className="bg-parish-50">
        <td className="px-4 py-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-parish-300 px-2 py-1 text-sm"
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="rounded-md border border-parish-300 px-2 py-1 text-sm"
          />
        </td>
        <td className="px-4 py-2 text-center">
          <input type="checkbox" checked={baptized} onChange={(e) => setBaptized(e.target.checked)} />
        </td>
        <td className="px-4 py-2 text-center">
          <input
            type="checkbox"
            checked={firstEucharist}
            onChange={(e) => setFirstEucharist(e.target.checked)}
          />
        </td>
        <td className="px-4 py-2 text-center">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
        </td>
        <td className="px-4 py-2">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="rounded-md bg-parish-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-parish-900"
            >
              Salvar
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-md border border-parish-300 px-2.5 py-1 text-xs font-medium text-parish-700 hover:bg-white"
            >
              Cancelar
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-parish-50">
      <td className="px-4 py-2 font-medium text-parish-900">{catechumen.name}</td>
      <td className="px-4 py-2 text-parish-600">{formatDateBR(catechumen.birthDate)}</td>
      <td className="px-4 py-2 text-center">{catechumen.baptized ? "Sim" : "Não"}</td>
      <td className="px-4 py-2 text-center">{catechumen.firstEucharist ? "Sim" : "Não"}</td>
      <td className="px-4 py-2 text-center">{catechumen.confirmed ? "Sim" : "Não"}</td>
      <td className="px-4 py-2">
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="rounded-md border border-parish-300 px-2.5 py-1 text-xs font-medium text-parish-700 hover:bg-parish-50"
          >
            Editar
          </button>
          <ConfirmButton
            label="Excluir"
            title="Excluir catequizando(a)"
            message={`Você está prestes a excluir permanentemente o cadastro de "${catechumen.name}". Esta ação não pode ser desfeita.`}
            confirmLabel="Excluir"
            onConfirm={handleDelete}
            className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
          />
        </div>
      </td>
    </tr>
  );
}
