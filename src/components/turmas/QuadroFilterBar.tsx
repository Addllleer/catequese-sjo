import { prisma } from "@/lib/prisma";
import { WEEKDAY_LABELS, WEEKDAY_ORDER, PERIOD_LABELS } from "@/lib/constants";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2];

export async function QuadroFilterBar({
  basePath,
  searchParams,
}: {
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  const [communities, levels] = await Promise.all([
    prisma.community.findMany({ orderBy: { sigla: "asc" } }),
    prisma.level.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <form
      method="get"
      action={basePath}
      className="mb-8 grid grid-cols-2 gap-3 rounded-lg border border-parish-200 bg-white p-4 sm:grid-cols-3 lg:grid-cols-6"
    >
      <div>
        <label htmlFor="ano" className="block text-xs font-medium text-parish-600">
          Ano
        </label>
        <select
          id="ano"
          name="ano"
          defaultValue={searchParams.ano ?? String(CURRENT_YEAR)}
          className="mt-1 w-full rounded-md border border-parish-300 bg-white px-2 py-1.5 text-sm"
        >
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="comunidade" className="block text-xs font-medium text-parish-600">
          Comunidade
        </label>
        <select
          id="comunidade"
          name="comunidade"
          defaultValue={searchParams.comunidade ?? ""}
          className="mt-1 w-full rounded-md border border-parish-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="">Todas</option>
          {communities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="nivel" className="block text-xs font-medium text-parish-600">
          Nível
        </label>
        <select
          id="nivel"
          name="nivel"
          defaultValue={searchParams.nivel ?? ""}
          className="mt-1 w-full rounded-md border border-parish-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="">Todos</option>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="dia" className="block text-xs font-medium text-parish-600">
          Dia da semana
        </label>
        <select
          id="dia"
          name="dia"
          defaultValue={searchParams.dia ?? ""}
          className="mt-1 w-full rounded-md border border-parish-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="">Todos</option>
          {WEEKDAY_ORDER.map((w) => (
            <option key={w} value={w}>
              {WEEKDAY_LABELS[w]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="periodo" className="block text-xs font-medium text-parish-600">
          Período
        </label>
        <select
          id="periodo"
          name="periodo"
          defaultValue={searchParams.periodo ?? ""}
          className="mt-1 w-full rounded-md border border-parish-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="">Todos</option>
          {Object.entries(PERIOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="status" className="block text-xs font-medium text-parish-600">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={searchParams.status ?? ""}
          className="mt-1 w-full rounded-md border border-parish-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="">Ativas e em planejamento</option>
          <option value="TODAS">Todas (incluir concluídas/arquivadas)</option>
          <option value="ATIVA">🟢 Somente ativas</option>
          <option value="PLANEJAMENTO">🟡 Somente em planejamento</option>
          <option value="CONCLUIDA">🔴 Somente concluídas/arquivadas</option>
        </select>
      </div>

      <div className="col-span-2 flex items-end gap-2 sm:col-span-3 lg:col-span-6">
        <button
          type="submit"
          className="rounded-md bg-parish-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-parish-900"
        >
          Aplicar filtros
        </button>
        <a href={basePath} className="rounded-md px-4 py-1.5 text-sm font-medium text-parish-600 hover:bg-parish-100">
          Limpar
        </a>
      </div>
    </form>
  );
}
