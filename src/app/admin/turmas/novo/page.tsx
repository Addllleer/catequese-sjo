import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, manageableLevelSlugs } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { ClassForm } from "@/components/turmas/ClassForm";

export const dynamic = "force-dynamic";

export default async function NewClassPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login?callbackUrl=/admin/turmas/novo");
  const user = session.user;
  const allowedSlugs = manageableLevelSlugs(user);

  const [levels, communities, rooms, catechists] = await Promise.all([
    prisma.level.findMany({ orderBy: { order: "asc" } }),
    prisma.community.findMany({ orderBy: { sigla: "asc" } }),
    prisma.room.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.catechist.findMany({ orderBy: { name: "asc" } }),
  ]);

  const allowedLevelIds = allowedSlugs ? levels.filter((l) => allowedSlugs.includes(l.slug)).map((l) => l.id) : null;

  if (allowedLevelIds && allowedLevelIds.length === 0) {
    return (
      <div className="max-w-2xl">
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Você não possui um nível de catequese sob sua responsabilidade. Entre em contato com o
          Responsável Paroquial.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link href="/admin/turmas" className="text-sm font-medium text-parish-600 hover:text-parish-900">
        ← Voltar às turmas
      </Link>

      <header className="mt-4 mb-8">
        <h1 className="font-serif text-2xl font-semibold text-parish-900">Nova turma</h1>
        <p className="mt-1 text-sm text-parish-500">
          O identificador é gerado automaticamente a partir do nível, comunidade, período e (quando
          aplicável) dos anos de vigência.
        </p>
      </header>

      <ClassForm
        levels={levels}
        communities={communities}
        rooms={rooms}
        catechists={catechists}
        action="/api/turmas"
        method="POST"
        allowedLevelIds={allowedLevelIds}
      />
    </div>
  );
}
