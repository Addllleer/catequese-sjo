import { DOCUMENT_CATEGORY_LABELS, DOCUMENT_TYPE_LABELS } from "@/lib/constants";

export function RepositoryFilterBar({
  basePath,
  searchParams,
}: {
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  return (
    <form
      method="get"
      action={basePath}
      className="mb-8 grid grid-cols-1 gap-3 rounded-lg border border-parish-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <div className="lg:col-span-2">
        <label htmlFor="busca" className="block text-xs font-medium text-parish-600">
          Buscar
        </label>
        <input
          id="busca"
          name="busca"
          type="search"
          placeholder="Nome, descrição ou tag..."
          defaultValue={searchParams.busca ?? ""}
          className="mt-1 w-full rounded-md border border-parish-300 px-2 py-1.5 text-sm"
        />
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
          {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="tipo" className="block text-xs font-medium text-parish-600">
          Tipo
        </label>
        <select
          id="tipo"
          name="tipo"
          defaultValue={searchParams.tipo ?? ""}
          className="mt-1 w-full rounded-md border border-parish-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="">Todos</option>
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end gap-2">
        <button
          type="submit"
          className="rounded-md bg-parish-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-parish-900"
        >
          Buscar
        </button>
        <a href={basePath} className="rounded-md px-4 py-1.5 text-sm font-medium text-parish-600 hover:bg-parish-100">
          Limpar
        </a>
      </div>
    </form>
  );
}
