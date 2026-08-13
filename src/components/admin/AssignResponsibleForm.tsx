"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AssignResponsibleForm({
  levelSlug,
  currentUserId,
  users,
}: {
  levelSlug: string;
  currentUserId: string | null;
  users: Array<{ id: string; name: string; email: string }>;
}) {
  const router = useRouter();
  const [userId, setUserId] = useState(currentUserId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/niveis/${levelSlug}/responsavel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId || null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Não foi possível salvar.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <select
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        className="rounded-md border border-parish-300 bg-white px-2 py-1.5 text-sm"
      >
        <option value="">— Sem responsável definido —</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.email})
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md border border-parish-300 px-3 py-1.5 text-sm font-medium text-parish-700 hover:bg-parish-50 disabled:opacity-60"
      >
        {loading ? "Salvando..." : "Salvar"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
