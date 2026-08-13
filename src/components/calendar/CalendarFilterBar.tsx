import { prisma } from "@/lib/prisma";
import { EVENT_CATEGORY_LABELS } from "@/lib/constants";
import { MONTH_NAMES } from "@/lib/events";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export async function CalendarFilterBar({
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
      className="mb-8 grid grid-cols-2 gap-3 rounded-lg border border-parish-200 bg-white p-4 sm:grid-cols-3 lg:grid-cols-5"
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
        <label htmlFor="mes" className="block text-xs font-medium text-parish-600">
          Mês
        </label>
        <select
          id="mes"
          name="mes"
          defaultValue={searchParams.mes ?? ""}
          className="mt-1 w-full rounded-md border border-parish-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="">Todos</option>
          {MONTH_NAMES.map((name, idx) => (
            <option key={name} value={idx + 1}>
              {name}
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
        <label htmlFor="categoria" className="block text-xs font-medium text-parish-600">
          Categoria
        </label>
        <select
          id="categoria"
          name="categoria"
          defaultValue={searchParams.categoria ?? ""}
          className="mt-1 w-full rounded-md border border-parish-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="">Todas</option>
          {Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="col-span-2 flex items-end gap-2 sm:col-span-3 lg:col-span-5">
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
