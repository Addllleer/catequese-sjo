"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PERIOD_LABELS, WEEKDAY_LABELS, WEEKDAY_ORDER } from "@/lib/constants";
import type { Period, Weekday, ClassStatus } from "@prisma/client";

export interface ClassFormLevel {
  id: string;
  name: string;
  slug: string;
  usesYearRange: boolean;
}
export interface ClassFormCommunity {
  id: string;
  name: string;
  sigla: string;
}
export interface ClassFormRoom {
  id: string;
  name: string;
  communityId: string;
}
export interface ClassFormCatechist {
  id: string;
  name: string;
  active: boolean;
}

export interface ClassFormInitial {
  levelId: string;
  communityId: string;
  period: Period;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  roomId: string | null;
  status: ClassStatus;
  startYear: number | null;
  endYear: number | null;
  catechumensCountOverride: number | null;
  notes: string;
  catechistIds: string[];
}

const PERIOD_SLUGS: Record<Period, string> = { MANHA: "manha", TARDE: "tarde", NOITE: "noite" };

export function ClassForm({
  levels,
  communities,
  rooms,
  catechists,
  initial,
  action,
  method,
  allowedLevelIds,
}: {
  levels: ClassFormLevel[];
  communities: ClassFormCommunity[];
  rooms: ClassFormRoom[];
  catechists: ClassFormCatechist[];
  initial?: Partial<ClassFormInitial>;
  action: string;
  method: "POST" | "PATCH";
  /** Responsável de nível só pode escolher o próprio nível na lista. */
  allowedLevelIds: string[] | null;
}) {
  const router = useRouter();
  const availableLevels = allowedLevelIds ? levels.filter((l) => allowedLevelIds.includes(l.id)) : levels;

  const [levelId, setLevelId] = useState(initial?.levelId ?? availableLevels[0]?.id ?? "");
  const [communityId, setCommunityId] = useState(initial?.communityId ?? communities[0]?.id ?? "");
  const [period, setPeriod] = useState<Period>(initial?.period ?? "MANHA");
  const [weekday, setWeekday] = useState<Weekday>(initial?.weekday ?? "SABADO");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "10:30");
  const [roomId, setRoomId] = useState(initial?.roomId ?? "");
  const [status, setStatus] = useState<ClassStatus>(initial?.status ?? "PLANEJAMENTO");
  const [startYear, setStartYear] = useState<string>(initial?.startYear ? String(initial.startYear) : "");
  const [endYear, setEndYear] = useState<string>(initial?.endYear ? String(initial.endYear) : "");
  const [countOverride, setCountOverride] = useState<string>(
    initial?.catechumensCountOverride != null ? String(initial.catechumensCountOverride) : ""
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [catechistIds, setCatechistIds] = useState<string[]>(initial?.catechistIds ?? []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<Array<{ type: string; message: string }>>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedLevel = levels.find((l) => l.id === levelId);
  const selectedCommunity = communities.find((c) => c.id === communityId);
  const roomsInCommunity = rooms.filter((r) => r.communityId === communityId);

  const identifierPreview = useMemo(() => {
    if (!selectedLevel || !selectedCommunity) return "";
    const parts = [selectedLevel.slug, selectedCommunity.sigla, PERIOD_SLUGS[period]];
    if (selectedLevel.usesYearRange) {
      parts.push(startYear || "AAAA", endYear || "AAAA");
    }
    return parts.join("-");
  }, [selectedLevel, selectedCommunity, period, startYear, endYear]);

  function toggleCatechist(id: string) {
    setCatechistIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setWarnings([]);

    try {
      const payload = {
        levelId,
        communityId,
        period,
        weekday,
        startTime,
        endTime,
        roomId: roomId || null,
        status,
        startYear: selectedLevel?.usesYearRange && startYear ? Number(startYear) : null,
        endYear: selectedLevel?.usesYearRange && endYear ? Number(endYear) : null,
        catechumensCountOverride: countOverride ? Number(countOverride) : null,
        notes: notes || null,
        catechistIds,
      };

      const res = await fetch(action, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error || "Não foi possível salvar a turma.");
      }

      setWarnings(body.warnings ?? []);
      setSuccess(`Turma salva com sucesso (${body.class.publicId}).`);
      router.refresh();

      if (method === "POST") {
        router.push(`/admin/turmas/${body.class.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-md border border-parish-200 bg-parish-50 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-parish-500">
          Identificador previsto
        </p>
        <p className="mt-0.5 font-mono text-sm text-parish-800">
          {identifierPreview || "—"}
          {method === "POST" && (
            <span className="text-parish-400"> (um sufixo numérico será adicionado automaticamente em caso de duplicidade)</span>
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="levelId" className="block text-sm font-medium text-parish-800">
            Nível *
          </label>
          <select
            id="levelId"
            required
            value={levelId}
            onChange={(e) => setLevelId(e.target.value)}
            className="mt-1 w-full rounded-md border border-parish-300 bg-white px-3 py-2 text-sm"
          >
            {availableLevels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="communityId" className="block text-sm font-medium text-parish-800">
            Comunidade *
          </label>
          <select
            id="communityId"
            required
            value={communityId}
            onChange={(e) => {
              setCommunityId(e.target.value);
              setRoomId("");
            }}
            className="mt-1 w-full rounded-md border border-parish-300 bg-white px-3 py-2 text-sm"
          >
            {communities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="period" className="block text-sm font-medium text-parish-800">
            Período *
          </label>
          <select
            id="period"
            required
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="mt-1 w-full rounded-md border border-parish-300 bg-white px-3 py-2 text-sm"
          >
            {Object.entries(PERIOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="weekday" className="block text-sm font-medium text-parish-800">
            Dia da semana *
          </label>
          <select
            id="weekday"
            required
            value={weekday}
            onChange={(e) => setWeekday(e.target.value as Weekday)}
            className="mt-1 w-full rounded-md border border-parish-300 bg-white px-3 py-2 text-sm"
          >
            {WEEKDAY_ORDER.map((w) => (
              <option key={w} value={w}>
                {WEEKDAY_LABELS[w]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-parish-800">
            Horário inicial *
          </label>
          <input
            id="startTime"
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 w-full rounded-md border border-parish-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-parish-800">
            Horário final *
          </label>
          <input
            id="endTime"
            type="time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1 w-full rounded-md border border-parish-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="roomId" className="block text-sm font-medium text-parish-800">
            Sala
          </label>
          <select
            id="roomId"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="mt-1 w-full rounded-md border border-parish-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">A definir</option>
            {roomsInCommunity.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-parish-800">
            Status *
          </label>
          <select
            id="status"
            required
            value={status}
            onChange={(e) => setStatus(e.target.value as ClassStatus)}
            className="mt-1 w-full rounded-md border border-parish-300 bg-white px-3 py-2 text-sm"
          >
            <option value="PLANEJAMENTO">🟡 Em planejamento</option>
            <option value="ATIVA">🟢 Ativa</option>
            <option value="CONCLUIDA">🔴 Concluída/Arquivada</option>
          </select>
        </div>

        {selectedLevel?.usesYearRange && (
          <>
            <div>
              <label htmlFor="startYear" className="block text-sm font-medium text-parish-800">
                Ano de início *
              </label>
              <input
                id="startYear"
                type="number"
                required
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                className="mt-1 w-full rounded-md border border-parish-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="endYear" className="block text-sm font-medium text-parish-800">
                Ano de término *
              </label>
              <input
                id="endYear"
                type="number"
                required
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
                className="mt-1 w-full rounded-md border border-parish-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-parish-500">
                Este nível inclui os anos no identificador da turma (seção 9 da especificação).
              </p>
            </div>
          </>
        )}

        <div>
          <label htmlFor="countOverride" className="block text-sm font-medium text-parish-800">
            Quantidade prevista/atual
          </label>
          <input
            id="countOverride"
            type="number"
            min={0}
            value={countOverride}
            onChange={(e) => setCountOverride(e.target.value)}
            className="mt-1 w-full rounded-md border border-parish-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-parish-500">
            Usada somente enquanto não houver lista individual de catequizandos cadastrada. Assim
            que houver lista, a contagem real prevalece automaticamente.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-parish-800">
          Observações
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full rounded-md border border-parish-300 px-3 py-2 text-sm"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-parish-800">Catequistas desta turma</legend>
        <div className="mt-2 grid max-h-64 grid-cols-1 gap-1.5 overflow-y-auto rounded-md border border-parish-200 p-3 sm:grid-cols-2">
          {catechists.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm text-parish-700">
              <input
                type="checkbox"
                checked={catechistIds.includes(c.id)}
                onChange={() => toggleCatechist(c.id)}
                className="h-4 w-4 rounded border-parish-300"
              />
              {c.name}
              {!c.active && <span className="text-xs text-parish-400">(inativo)</span>}
            </label>
          ))}
        </div>
      </fieldset>

      {warnings.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-900">Atenção — possíveis conflitos:</p>
          <ul className="mt-1 list-inside list-disc text-sm text-amber-800">
            {warnings.map((w, i) => (
              <li key={i}>{w.message}</li>
            ))}
          </ul>
        </div>
      )}

      {success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">{success}</p>
      )}
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-parish-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-parish-900 disabled:opacity-60"
        >
          {loading ? "Salvando..." : method === "POST" ? "Criar turma" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
