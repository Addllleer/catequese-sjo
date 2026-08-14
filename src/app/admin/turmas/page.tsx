import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, manageableLevelSlugs } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCatechumensCount } from "@/lib/classStats";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { WEEKDAY_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminClassesListPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login?callbackUrl=/admin/turmas");
  const user = session.user;
  const allowedLevels = manageableLevelSlugs(user);

  const classes = await prisma.class.findMany({
    where: allowedLevels ? { level: { slug: { in: allowedLevels } } } : undefined,
    include: {
      level: true,
      community: true,
      room: true,
      catechists: { include: { catechist: true } },
      catechumens: { select: { id: true, baptized: true, firstEucharist: true, confirmed: true } },
    },
    orderBy: [{ status: "asc" }, { community: { sigla: "asc" } }, { level: { order: "asc" } }],
  });

  return (
    <div className="max-w-6xl">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-parish-900">Turmas</h1>
          <p className="mt-1 text-sm text-parish-500">Todas as turmas cadastradas, incluindo as arquivadas.</p>
        </div>
        <Link
          href="/admin/turmas/novo"
          className="rounded-md bg-parish-800 px-4 py-2 text-sm font-medium text-white hover:bg-parish-900"
        >
          + Nova turma
        </Link>
      </header>

      <div className="table-scroll rounded-lg border border-parish-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-parish-100 text-xs uppercase tracking-wide text-parish-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Identificador</th>
              <th className="px-4 py-3 font-semibold">Nível</th>
              <th className="px-4 py-3 font-semibold">Comunidade</th>
              <th className="px-4 py-3 font-semibold">Dia / Horário</th>
              <th className="px-4 py-3 font-semibold">Catequizandos</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-parish-100">
            {classes.map((c) => (
              <tr key={c.id} className="hover:bg-parish-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/turmas/${c.id}`} className="font-mono text-xs font-medium text-parish-800 hover:underline">
                    {c.publicId}
                  </Link>
                </td>
                <td className="px-4 py-3">{c.level.name}</td>
                <td className="px-4 py-3">{c.community.name}</td>
                <td className="px-4 py-3">
                  {WEEKDAY_LABELS[c.weekday]} · {c.startTime}–{c.endTime}
                </td>
                <td className="px-4 py-3">{getCatechumensCount(c)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
