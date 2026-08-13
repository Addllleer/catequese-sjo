import type { Metadata } from "next";
import { fetchQuadroClasses, groupByCommunity, toTableRow } from "@/lib/classQueries";
import { QuadroFilterBar } from "@/components/turmas/QuadroFilterBar";
import { ClassTable } from "@/components/ClassTable";
import type { ClassStatus, Period, Weekday } from "@prisma/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Catequese" };

export default async function CatequesePage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const status = searchParams.status && searchParams.status !== "TODAS"
    ? (searchParams.status as ClassStatus)
    : undefined;
  const includeArchived = searchParams.status === "TODAS";

  const classes = await fetchQuadroClasses({
    year: searchParams.ano ? Number(searchParams.ano) : undefined,
    communityId: searchParams.comunidade || undefined,
    levelId: searchParams.nivel || undefined,
    weekday: (searchParams.dia as Weekday) || undefined,
    period: (searchParams.periodo as Period) || undefined,
    status,
    includeArchived,
  });

  const groups = groupByCommunity(classes);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-parish-900">Quadro Geral da Catequese</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-parish-600">
          Turmas organizadas por comunidade, com nível, dia, horário, sala e quantidade de
          catequizandos. Os nomes dos catequistas não são exibidos nesta área pública.
        </p>
      </header>

      <QuadroFilterBar basePath="/catequese" searchParams={searchParams} />

      {groups.length === 0 ? (
        <p className="rounded-md border border-dashed border-parish-300 bg-white px-4 py-8 text-center text-sm text-parish-500">
          Nenhuma turma encontrada para os filtros selecionados.
        </p>
      ) : (
        groups.map((group) => (
          <ClassTable
            key={group.community.id}
            communityName={group.community.name}
            showCatechists={false}
            rows={group.classes.map((c) =>
              toTableRow(c, { basePath: "/catequese", showCatechists: false })
            )}
          />
        ))
      )}
    </div>
  );
}
