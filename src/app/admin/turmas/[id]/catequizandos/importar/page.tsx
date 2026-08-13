import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession, canManageLevel } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { ImportWizard } from "@/components/catequizandos/ImportWizard";

export const dynamic = "force-dynamic";

export default async function ImportCatechumensPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user) redirect(`/login?callbackUrl=/admin/turmas/${params.id}/catequizandos/importar`);
  const user = session.user;

  const cls = await prisma.class.findUnique({
    where: { id: params.id },
    include: { level: true, community: true },
  });
  if (!cls) notFound();

  if (!canManageLevel(user, cls.level.slug)) {
    return (
      <div className="max-w-2xl">
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Você não tem permissão para importar catequizandos nesta turma.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link
        href={`/admin/turmas/${cls.id}/catequizandos`}
        className="text-sm font-medium text-parish-600 hover:text-parish-900"
      >
        ← Voltar aos catequizandos
      </Link>

      <header className="mt-4 mb-8">
        <h1 className="font-serif text-2xl font-semibold text-parish-900">Importar catequizandos</h1>
        <p className="mt-1 max-w-2xl text-sm text-parish-500">
          A importação substitui integralmente a lista atual de catequizandos desta turma. Nada é
          alterado até a confirmação explícita, e nenhuma alteração parcial ocorre em caso de erro.
        </p>
      </header>

      <ImportWizard classId={cls.id} className={`${cls.level.name} — ${cls.community.name} (${cls.publicId})`} />
    </div>
  );
}
