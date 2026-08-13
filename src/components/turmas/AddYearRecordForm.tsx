"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddYearRecordForm({
  classId,
  rooms,
  catechists,
  onDone,
}: {
  classId: string;
  rooms: Array<{ id: string; name: string }>;
  catechists: Array<{ id: string; name: string }>;
  onDone: () => void;
}) {
  const router = useRouter();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [roomId, setRoomId] = useState("");
  const [count, setCount] = useState("");
  const [notes, setNotes] = useState("");
  const [catechistIds, setCatechistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/turmas/${classId}/historico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: Number(year),
          roomId: roomId || null,
          catechumensCount: count ? Number(count) : null,
          notes: notes || null,
          catechistIds,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Não foi possível salvar o registro histórico.");
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
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-parish-300 bg-parish-50 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-parish-600">Ano</label>
          <input
            type="number"
            required
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="mt-1 w-full rounded-md border border-parish-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-parish-600">Sala naquele ano</label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="mt-1 w-full rounded-md border border-parish-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">—</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-parish-600">Catequizandos naquele ano</label>
          <input
            type="number"
            min={0}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="mt-1 w-full rounded-md border border-parish-300 px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-parish-600">Catequistas naquele ano</label>
        <div className="mt-1 grid max-h-32 grid-cols-2 gap-1 overflow-y-auto rounded-md border border-parish-200 bg-white p-2">
          {catechists.map((c) => (
            <label key={c.id} className="flex items-center gap-1.5 text-xs text-parish-700">
              <input
                type="checkbox"
                checked={catechistIds.includes(c.id)}
                onChange={() =>
                  setCatechistIds((prev) =>
                    prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                  )
                }
              />
              {c.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-parish-600">Observações</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full rounded-md border border-parish-300 px-2 py-1.5 text-sm"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-parish-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-parish-900 disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Salvar registro do ano"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-parish-300 px-3 py-1.5 text-xs font-medium text-parish-700 hover:bg-parish-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
