import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession, canManageLevel } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCatechumensCount, computeSacramentIndicators } from "@/lib/classStats";
import { toTableRow } from "@/lib/classQueries";
import { ClassTable } from "@/components/ClassTable";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

export default async function LevelManagementPage({ params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session?.user) redirect(`/login?callbackUrl=/admin/niveis/${params.slug}`);
  const user = session.user;

  const level = await prisma.level.findUnique({ where: { slug: params.slug } });
  if (!level) notFound();

  // Responsável de nível só pode ver a gestão do próprio nível — ainda que
  // digite a URL de outro nível diretamente (especificação, seção 16/50).
  const canView = user.role === "ADMIN" || canManageLevel(user, level.slug);
  if (!canView) {
    return (
      <div className="max-w-2xl">
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Você não tem permissão para visualizar a gestão deste nível.
        </p>
      </div>
    );
  }

  const classes = await prisma.class.findMany({
    where: { levelId: level.id, status: { not: "CONCLUIDA" } },
    include: {
      community: true,
      level: true,
      room: true,
      catechists: { include: { catechist: true } },
      catechumens: true,
    },
    orderBy: [{ community: { sigla: "asc" } }, { weekday: "asc" }],
  });

  const allCatechumens = classes.flatMap((c) => c.catechumens);
  const indicators = computeSacramentIndicators(allCatechumens);
  const catechistMap = new Map<string, string>();
  for (const c of classes) for (const cc of c.catechists) catechistMap.set(cc.catechist.id, cc.catechist.name);

  const byCommunity = new Map<string, { name: string; classes: number; catechumens: number }>();
  for (const c of classes) {
    const key = c.community.id;
    if (!byCommunity.has(key)) byCommunity.set(key, { name: c.community.name, classes: 0, catechumens: 0 });
    const entry = byCommunity.get(key)!;
    entry.classes += 1;
    entry.catechumens += getCatechumensCount(c);
  }
  const communityRows = Array.from(byCommunity.values());
  const totalClasses = communityRows.reduce((s, r) => s + r.classes, 0);
  const totalCatechumens = communityRows.reduce((s, r) => s + r.catechumens, 0);

  return (
    <div className="max-w-5xl">
      <header className="mb-8">
        <h1 className="font-serif text-2xl font-semibold text-parish-900">Gestão de {level.name}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-parish-600">{level.description}</p>
      </header>

      <section className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Turmas" value={classes.length} />
        <StatCard label="Catequistas" value={catechistMap.size} />
        <StatCard label="Catequizandos" value={indicators.total} />
        <StatCard label="Sem Batismo" value={indicators.notBaptized} />
        <StatCard label="Sem Eucaristia" value={indicators.notFirstEucharist} />
      </section>

      <section className="mb-10">
        <h2 className="mb-3 font-serif text-lg font-semibold text-parish-900">Turmas</h2>
        {classes.length === 0 ? (
          <p className="rounded-md border border-dashed border-parish-300 bg-white px-4 py-6 text-sm text-parish-500">
            Nenhuma turma ativa ou em planejamento neste nível.
          </p>
        ) : (
          <div className="table-scroll rounded-lg border border-parish-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-parish-100 text-xs uppercase tracking-wide text-parish-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Comunidade</th>
                  <th className="px-4 py-3 font-semibold">Dia / Horário</th>
                  <th className="px-4 py-3 font-semibold">Sala</th>
                  <th className="px-4 py-3 font-semibold">Catequizandos</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parish-100">
                {classes.map((c) => (
                  <tr key={c.id} className="hover:bg-parish-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/turmas/${c.id}`} className="font-medium text-parish-800 hover:underline">
                        {c.community.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{c.weekday} · {c.startTime}–{c.endTime}</td>
                    <td className="px-4 py-3">{c.room?.name ?? "—"}</td>
                    <td className="px-4 py-3">{getCatechumensCount(c)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-3 font-serif text-lg font-semibold text-parish-900">Catequistas do nível</h2>
        {catechistMap.size === 0 ? (
          <p className="rounded-md border border-dashed border-parish-300 bg-white px-4 py-6 text-sm text-parish-500">
            Nenhum catequista associado a turmas deste nível.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {Array.from(catechistMap.values()).map((name) => (
              <li key={name} className="rounded-full border border-parish-300 bg-white px-3 py-1 text-sm text-parish-700">
                {name}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg font-semibold text-parish-900">Distribuição por comunidade</h2>
        <div className="table-scroll rounded-lg border border-parish-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-parish-100 text-xs uppercase tracking-wide text-parish-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Comunidade</th>
                <th className="px-4 py-3 font-semibold">Turmas</th>
                <th className="px-4 py-3 font-semibold">Catequizandos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-parish-100">
              {communityRows.map((row) => (
                <tr key={row.name}>
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3">{row.classes}</td>
                  <td className="px-4 py-3">{row.catechumens}</td>
                </tr>
              ))}
              <tr className="bg-parish-50 font-semibold">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3">{totalClasses}</td>
                <td className="px-4 py-3">{totalCatechumens}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-parish-200 bg-white p-4">
      <p className="text-2xl font-semibold text-parish-900">{value}</p>
      <p className="mt-0.5 text-xs text-parish-500">{label}</p>
    </div>
  );
}
