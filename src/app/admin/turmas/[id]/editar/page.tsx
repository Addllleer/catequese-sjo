import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession, canManageLevel, manageableLevelSlugs } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { ClassForm } from "@/components/turmas/ClassForm";

export const dynamic = "force-dynamic";

export default async function EditClassPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user) redirect(`/login?callbackUrl=/admin/turmas/${params.id}/editar`);
  const user = session.user;

  const cls = await prisma.class.findUnique({
    where: { id: params.id },
    include: { level: true, catechists: true },
  });
  if (!cls) notFound();

  if (!canManageLevel(user, cls.level.slug)) {
    return (
      <div className="max-w-2xl">
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Você não tem permissão para editar esta turma.
        </p>
      </div>
    );
  }

  const allowedSlugs = manageableLevelSlugs(user);
  const [levels, communities, rooms, catechists] = await Promise.all([
    prisma.level.findMany({ orderBy: { order: "asc" } }),
    prisma.community.findMany({ orderBy: { sigla: "asc" } }),
    prisma.room.findMany({ orderBy: { name: "asc" } }),
    prisma.catechist.findMany({ orderBy: { name: "asc" } }),
  ]);
  const allowedLevelIds = allowedSlugs ? levels.filter((l) => allowedSlugs.includes(l.slug)).map((l) => l.id) : null;

  return (
    <div className="max-w-3xl">
      <Link href={`/admin/turmas/${cls.id}`} className="text-sm font-medium text-parish-600 hover:text-parish-900">
        ← Voltar à turma
      </Link>

      <header className="mt-4 mb-8">
        <h1 className="font-serif text-2xl font-semibold text-parish-900">Editar turma</h1>
        <p className="mt-1 font-mono text-sm text-parish-400">{cls.publicId}</p>
      </header>

      <ClassForm
        levels={levels}
        communities={communities}
        rooms={rooms}
        catechists={catechists}
        action={`/api/turmas/${cls.id}`}
        method="PATCH"
        allowedLevelIds={allowedLevelIds}
        initial={{
          levelId: cls.levelId,
          communityId: cls.communityId,
          period: cls.period,
          weekday: cls.weekday,
          startTime: cls.startTime,
          endTime: cls.endTime,
          roomId: cls.roomId,
          status: cls.status,
          startYear: cls.startYear,
          endYear: cls.endYear,
          catechumensCountOverride: cls.catechumensCountOverride,
          notes: cls.notes ?? "",
          catechistIds: cls.catechists.map((c) => c.catechistId),
        }}
      />
    </div>
  );
}
