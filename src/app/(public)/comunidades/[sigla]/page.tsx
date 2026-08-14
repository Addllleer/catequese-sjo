import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toTableRow } from "@/lib/classQueries";
import { ClassTable } from "@/components/ClassTable";

export const dynamic = "force-dynamic";

export default async function CommunityDetailPage({ params }: { params: { sigla: string } }) {
  const community = await prisma.community.findUnique({ where: { sigla: params.sigla } });
  if (!community) notFound();

  const classes = await prisma.class.findMany({
    where: { communityId: community.id, status: { not: "CONCLUIDA" } },
    include: {
      level: true,
      community: true,
      room: true,
      catechists: { include: { catechist: true } },
         catechumens: { select: { id: true, baptized: true, firstEucharist: true, confirmed: true } },
    },
    orderBy: [{ level: { order: "asc" } }, { weekday: "asc" }],
  });

  const rows = classes.map((c) =>
    toTableRow(c as any, { basePath: "/catequese", showCatechists: false })
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/comunidades" className="text-sm font-medium text-parish-600 hover:text-parish-900">
        ← Voltar às comunidades
      </Link>

      <header className="mt-4 mb-8">
        <h1 className="font-serif text-3xl font-semibold text-parish-900">{community.name}</h1>
        <p className="mt-2 text-sm text-parish-500">
          {classes.length} turma(s) ativa(s) ou em planejamento
        </p>
      </header>

      <ClassTable communityName={community.name} rows={rows} showCatechists={false} />
    </div>
  );
}
