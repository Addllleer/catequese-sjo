import Link from "next/link";
import type { ClassStatus } from "@prisma/client";
import { StatusBadge } from "./ui/StatusBadge";

export interface ClassTableRow {
  id: string;
  publicId: string;
  href: string;
  levelName: string;
  weekdayLabel: string;
  timeRange: string;
  roomName: string;
  catechistNames?: string[];
  catechumensCount: number;
  status: ClassStatus;
}

/**
 * Reproduz a lógica da planilha usada atualmente pela coordenação
 * (especificação, seções 2 e 35): turmas agrupadas por comunidade, em
 * formato tabular, com nível/dia/horário/sala/[catequistas]/catequizandos.
 *
 * showCatechists=false (visão pública): coluna "Catequistas" é OMITIDA.
 * showCatechists=true (visão administrativa): coluna é exibida.
 */
export function ClassTable({
  communityName,
  rows,
  showCatechists,
  showStatus = true,
}: {
  communityName: string;
  rows: ClassTableRow[];
  showCatechists: boolean;
  showStatus?: boolean;
}) {
  return (
    <section aria-labelledby={`comunidade-${communityName}`} className="mb-8">
      <h3
        id={`comunidade-${communityName}`}
        className="mb-3 border-l-4 border-gold-500 pl-3 font-serif text-lg font-semibold text-parish-900"
      >
        {communityName}
      </h3>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-parish-300 bg-white px-4 py-6 text-sm text-parish-500">
          Nenhuma turma encontrada para os filtros selecionados nesta comunidade.
        </p>
      ) : (
        <div className="table-scroll rounded-lg border border-parish-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-parish-100 text-xs uppercase tracking-wide text-parish-600">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Nível
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Dia
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Horário
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Sala
                </th>
                {showCatechists && (
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Catequistas
                  </th>
                )}
                <th scope="col" className="px-4 py-3 font-semibold">
                  Catequizandos
                </th>
                {showStatus && (
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Status
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-parish-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-parish-50">
                  <td className="px-4 py-3">
                    <Link href={row.href} className="font-medium text-parish-800 hover:underline">
                      {row.levelName}
                    </Link>
                    <div className="text-xs text-parish-400">{row.publicId}</div>
                  </td>
                  <td className="px-4 py-3">{row.weekdayLabel}</td>
                  <td className="px-4 py-3">{row.timeRange}</td>
                  <td className="px-4 py-3">{row.roomName || "—"}</td>
                  {showCatechists && (
                    <td className="px-4 py-3">
                      {row.catechistNames && row.catechistNames.length > 0
                        ? row.catechistNames.join(", ")
                        : "—"}
                    </td>
                  )}
                  <td className="px-4 py-3">{row.catechumensCount}</td>
                  {showStatus && (
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
