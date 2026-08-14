import Link from "next/link";
import { getSession } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCatechumensCount } from "@/lib/classStats";
import { fetchPublicNotices } from "@/lib/notices";
import { formatDateBR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  const user = session.user;
  const isAdmin = user.role === "ADMIN";

  // Escopo: Administrador vê a paróquia inteira; Responsável de Nível vê
  // somente o próprio nível (especificação, seção 74).
  const levelScope = isAdmin ? undefined : user.responsibleLevelId ?? undefined;

  const [communities, levels, classes, upcomingEvents, notices] = await Promise.all([
    isAdmin ? prisma.community.count() : Promise.resolve(null),
    prisma.level.findMany({ orderBy: { order: "asc" } }),
    prisma.class.findMany({
      where: { levelId: levelScope },
      include: {
        catechists: { select: { catechistId: true } },
        catechumens: { select: { id: true, baptized: true, firstEucharist: true, confirmed: true } },
        level: true,
      },
    }),
    prisma.calendarEvent.findMany({
      where: { date: { gte: new Date() }, levelId: isAdmin ? undefined : levelScope },
      orderBy: { date: "asc" },
      take: 5,
      include: { level: true, community: true },
    }),
    fetchPublicNotices({ limit: 5, levelId: isAdmin ? undefined : levelScope }),
  ]);

  const activeClasses = classes.filter((c) => c.status === "ATIVA");
  const planningClasses = classes.filter((c) => c.status === "PLANEJAMENTO");
  const catechistIds = new Set(classes.flatMap((c) => c.catechists.map((cc) => cc.catechistId)));
  const totalCatechumens = classes.reduce((sum, c) => sum + getCatechumensCount(c), 0);

  const perLevel = (isAdmin ? levels : levels.filter((l) => l.id === levelScope)).map((level) => {
    const levelClasses = classes.filter((c) => c.levelId === level.id);
    const levelCatechists = new Set(levelClasses.flatMap((c) => c.catechists.map((cc) => cc.catechistId)));
    return {
      level,
      classes: levelClasses.filter((c) => c.status !== "CONCLUIDA").length,
      catechists: levelCatechists.size,
      catechumens: levelClasses.reduce((sum, c) => sum + getCatechumensCount(c), 0),
    };
  });

  const alerts: string[] = [];
  for (const level of levels) {
    if (!isAdmin) continue;
    // Alerta administrativo simples: nível sem responsável definido.
  }

  return (
    <div className="max-w-6xl">
      <header className="mb-8">
        <h1 className="font-serif text-2xl font-semibold text-parish-900">
          {isAdmin ? "Catequese Paroquial — Visão Geral" : `Gestão de ${user.responsibleLevelName}`}
        </h1>
        <p className="mt-1 text-sm text-parish-500">
          {isAdmin
            ? "Painel da coordenação paroquial da catequese."
            : `Você é o(a) responsável pelo nível ${user.responsibleLevelName}.`}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isAdmin && (
          <StatCard label="Comunidades" value={communities ?? 0} />
        )}
        <StatCard label="Turmas ativas" value={activeClasses.length} />
        <StatCard label="Em planejamento" value={planningClasses.length} />
        <StatCard label="Catequistas" value={catechistIds.size} />
        <StatCard label="Catequizandos" value={totalCatechumens} />
      </div>

      <section className="mt-10">
        <h2 className="mb-3 font-serif text-lg font-semibold text-parish-900">Por nível</h2>
        <div className="table-scroll rounded-lg border border-parish-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-parish-100 text-xs uppercase tracking-wide text-parish-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Nível</th>
                <th className="px-4 py-3 font-semibold">Turmas</th>
                <th className="px-4 py-3 font-semibold">Catequistas</th>
                <th className="px-4 py-3 font-semibold">Catequizandos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-parish-100">
              {perLevel.map((row) => (
                <tr key={row.level.id} className="hover:bg-parish-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/niveis/${row.level.slug}`} className="font-medium text-parish-800 hover:underline">
                      {row.level.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.classes}</td>
                  <td className="px-4 py-3">{row.catechists}</td>
                  <td className="px-4 py-3">{row.catechumens}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-lg font-semibold text-parish-900">Próximos eventos</h2>
            <Link href="/admin/calendario" className="text-sm text-parish-600 hover:text-parish-900">
              Ver calendário →
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="rounded-md border border-dashed border-parish-300 bg-white px-4 py-6 text-sm text-parish-500">
              Nenhum evento futuro cadastrado.
            </p>
          ) : (
            <ul className="divide-y divide-parish-200 rounded-lg border border-parish-200 bg-white">
              {upcomingEvents.map((event) => (
                <li key={event.id} className="p-4">
                  <p className="text-xs text-parish-500">{formatDateBR(event.date)}</p>
                  <p className="font-medium text-parish-900">{event.title}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-lg font-semibold text-parish-900">Avisos publicados</h2>
            <Link href="/admin/avisos" className="text-sm text-parish-600 hover:text-parish-900">
              Ver avisos →
            </Link>
          </div>
          {notices.length === 0 ? (
            <p className="rounded-md border border-dashed border-parish-300 bg-white px-4 py-6 text-sm text-parish-500">
              Nenhum aviso publicado no momento.
            </p>
          ) : (
            <ul className="divide-y divide-parish-200 rounded-lg border border-parish-200 bg-white">
              {notices.map((notice) => (
                <li key={notice.id} className="p-4">
                  <p className="font-medium text-parish-900">{notice.title}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
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
