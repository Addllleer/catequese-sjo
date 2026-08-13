import { redirect } from "next/navigation";
import { getSession, manageableLevelSlugs } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCatechumensCount, computeSacramentIndicators } from "@/lib/classStats";

export const dynamic = "force-dynamic";

/**
 * Relatórios respeitam o escopo do usuário (especificação, seção 67): o
 * Administrador vê a paróquia inteira; o Responsável de Nível vê somente o
 * próprio nível — mesmo agregado, nenhum filtro aqui permite obter dados de
 * outro nível. Nenhum dado individual de catequizando aparece em relatório.
 */
export default async function AdminReportsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login?callbackUrl=/admin/relatorios");
  const user = session.user;
  const allowedSlugs = manageableLevelSlugs(user);

  const classes = await prisma.class.findMany({
    where: allowedSlugs ? { level: { slug: { in: allowedSlugs } } } : undefined,
    include: {
      level: true,
      community: true,
      catechists: { select: { catechistId: true } },
      catechumens: true,
    },
  });

  type Agg = { classes: number; catechists: Set<string>; catechumens: number };
  const byCommunity = new Map<string, Agg & { name: string }>();
  const byLevel = new Map<string, Agg & { name: string }>();

  for (const c of classes) {
    const cKey = c.communityId;
    if (!byCommunity.has(cKey)) byCommunity.set(cKey, { name: c.community.name, classes: 0, catechists: new Set(), catechumens: 0 });
    const cEntry = byCommunity.get(cKey)!;
    cEntry.classes += 1;
    c.catechists.forEach((cc) => cEntry.catechists.add(cc.catechistId));
    cEntry.catechumens += getCatechumensCount(c);

    const lKey = c.levelId;
    if (!byLevel.has(lKey)) byLevel.set(lKey, { name: c.level.name, classes: 0, catechists: new Set(), catechumens: 0 });
    const lEntry = byLevel.get(lKey)!;
    lEntry.classes += 1;
    c.catechists.forEach((cc) => lEntry.catechists.add(cc.catechistId));
    lEntry.catechumens += getCatechumensCount(c);
  }

  const allCatechumens = classes.flatMap((c) => c.catechumens);
  const indicators = computeSacramentIndicators(allCatechumens);

  return (
    <div className="max-w-4xl">
      <header className="mb-8">
        <h1 className="font-serif text-2xl font-semibold text-parish-900">Relatórios</h1>
        <p className="mt-1 text-sm text-parish-500">
          {allowedSlugs
            ? "Dados restritos ao seu nível de responsabilidade. Nenhum dado individual é exibido."
            : "Visão consolidada da paróquia. Nenhum dado individual é exibido."}
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 font-serif text-lg font-semibold text-parish-900">Sacramentos</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard label="Catequizandos" value={indicators.total} />
          <StatCard label="Batizados" value={indicators.baptized} />
          <StatCard label="Não batizados" value={indicators.notBaptized} />
          <StatCard label="Com Eucaristia" value={indicators.firstEucharist} />
          <StatCard label="Sem Eucaristia" value={indicators.notFirstEucharist} />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 font-serif text-lg font-semibold text-parish-900">Por comunidade</h2>
        <ReportTable
          rows={Array.from(byCommunity.values()).map((r) => ({
            name: r.name,
            classes: r.classes,
            catechists: r.catechists.size,
            catechumens: r.catechumens,
          }))}
        />
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg font-semibold text-parish-900">Por nível</h2>
        <ReportTable
          rows={Array.from(byLevel.values()).map((r) => ({
            name: r.name,
            classes: r.classes,
            catechists: r.catechists.size,
            catechumens: r.catechumens,
          }))}
        />
      </section>
    </div>
  );
}

function ReportTable({ rows }: { rows: Array<{ name: string; classes: number; catechists: number; catechumens: number }> }) {
  const total = rows.reduce(
    (acc, r) => ({ classes: acc.classes + r.classes, catechists: acc.catechists + r.catechists, catechumens: acc.catechumens + r.catechumens }),
    { classes: 0, catechists: 0, catechumens: 0 }
  );

  return (
    <div className="table-scroll rounded-lg border border-parish-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-parish-100 text-xs uppercase tracking-wide text-parish-600">
          <tr>
            <th className="px-4 py-3 font-semibold">Nome</th>
            <th className="px-4 py-3 font-semibold">Turmas</th>
            <th className="px-4 py-3 font-semibold">Catequistas</th>
            <th className="px-4 py-3 font-semibold">Catequizandos</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-parish-100">
          {rows.map((r) => (
            <tr key={r.name}>
              <td className="px-4 py-3">{r.name}</td>
              <td className="px-4 py-3">{r.classes}</td>
              <td className="px-4 py-3">{r.catechists}</td>
              <td className="px-4 py-3">{r.catechumens}</td>
            </tr>
          ))}
          <tr className="bg-parish-50 font-semibold">
            <td className="px-4 py-3">Total</td>
            <td className="px-4 py-3">{total.classes}</td>
            <td className="px-4 py-3">{total.catechists}</td>
            <td className="px-4 py-3">{total.catechumens}</td>
          </tr>
        </tbody>
      </table>
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
