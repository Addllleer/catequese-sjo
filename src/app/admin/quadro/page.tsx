import Link from "next/link";
import { getSession, manageableLevelSlugs } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { fetchQuadroClasses, groupByCommunity, toTableRow } from "@/lib/classQueries";
import { QuadroFilterBar } from "@/components/turmas/QuadroFilterBar";
import { ClassTable } from "@/components/ClassTable";
import type { ClassStatus, Period, Weekday } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminQuadroPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/login?callbackUrl=/admin/quadro");
  const user = session.user;

  const status =
    searchParams.status && searchParams.status !== "TODAS"
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

  // Responsável de nível só enxerga as turmas do próprio nível — mesmo que
  // manipule os filtros da URL (a filtragem real ocorre aqui, no servidor).
  const allowedLevels = manageableLevelSlugs(user);
  const scoped = allowedLevels === null ? classes : classes.filter((c) => allowedLevels.includes(c.level.slug));

  const groups = groupByCommunity(scoped);
  const canCreate = user.role === "ADMIN" || (allowedLevels && allowedLevels.length > 0);

  return (
    <div className="max-w-6xl">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-parish-900">Quadro de Turmas</h1>
          <p className="mt-1 text-sm text-parish-500">
            Turmas por comunidade, com catequistas e quantidade de catequizandos.
          </p>
        </div>
        {canCreate && (
          <Link
            href="/admin/turmas/novo"
            className="rounded-md bg-parish-800 px-4 py-2 text-sm font-medium text-white hover:bg-parish-900"
          >
            + Nova turma
          </Link>
        )}
      </header>

      <QuadroFilterBar basePath="/admin/quadro" searchParams={searchParams} />

      {groups.length === 0 ? (
        <p className="rounded-md border border-dashed border-parish-300 bg-white px-4 py-8 text-center text-sm text-parish-500">
          Nenhuma turma encontrada para os filtros selecionados.
        </p>
      ) : (
        groups.map((group) => (
          <ClassTable
            key={group.community.id}
            communityName={group.community.name}
            showCatechists
            rows={group.classes.map((c) =>
              toTableRow(c, { basePath: "/admin/turmas", showCatechists: true })
            )}
          />
        ))
      )}
    </div>
  );
}
