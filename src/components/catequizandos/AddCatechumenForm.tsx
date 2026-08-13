"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddCatechumenForm({ classId, onDone }: { classId: string; onDone: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [baptized, setBaptized] = useState(false);
  const [firstEucharist, setFirstEucharist] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/turmas/${classId}/catequizandos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, birthDate, baptized, firstEucharist, confirmed }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Não foi possível cadastrar.");
      }
      router.refresh();
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-parish-200 bg-white p-5 sm:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-parish-800">Nome completo *</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-parish-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-parish-800">Data de nascimento *</label>
        <input
          type="date"
          required
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className="mt-1 w-full rounded-md border border-parish-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-center gap-6 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm text-parish-700">
          <input type="checkbox" checked={baptized} onChange={(e) => setBaptized(e.target.checked)} /> Batismo
        </label>
        <label className="flex items-center gap-2 text-sm text-parish-700">
          <input
            type="checkbox"
            checked={firstEucharist}
            onChange={(e) => setFirstEucharist(e.target.checked)}
          />{" "}
          Primeira Eucaristia
        </label>
        <label className="flex items-center gap-2 text-sm text-parish-700">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} /> Crisma
        </label>
      </div>

      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

      <div className="flex gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-parish-800 px-4 py-2 text-sm font-medium text-white hover:bg-parish-900 disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Cadastrar"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-parish-300 px-4 py-2 text-sm font-medium text-parish-700 hover:bg-parish-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
