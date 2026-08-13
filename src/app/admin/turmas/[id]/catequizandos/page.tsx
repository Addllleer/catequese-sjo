import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession, canManageLevel } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CreatePanel } from "@/components/admin/CreatePanel";
import { AddCatechumenForm } from "@/components/catequizandos/AddCatechumenForm";
import { CatechumenRow } from "@/components/catequizandos/CatechumenRow";

export const dynamic = "force-dynamic";

/**
 * Tela protegida (especificação, seção 40 e 48): acessível somente ao
 * Administrador e ao Responsável do nível correspondente. A checagem abaixo
 * roda no servidor — não é apenas a interface que esconde o menu.
 */
export default async function ClassCatechumensPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user) redirect(`/login?callbackUrl=/admin/turmas/${params.id}/catequizandos`);
  const user = session.user;

  const cls = await prisma.class.findUnique({
    where: { id: params.id },
    include: { level: true, community: true, catechumens: { orderBy: { name: "asc" } } },
  });
  if (!cls) notFound();

  if (!canManageLevel(user, cls.level.slug)) {
    return (
      <div className="max-w-2xl">
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Você não tem permissão para acessar os catequizandos desta turma.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <Link href={`/admin/turmas/${cls.id}`} className="text-sm font-medium text-parish-600 hover:text-parish-900">
        ← Voltar à turma
      </Link>

      <header className="mt-4 mb-2">
        <h1 className="font-serif text-2xl font-semibold text-parish-900">
          Catequizandos — {cls.level.name} ({cls.community.name})
        </h1>
        <p className="mt-1 font-mono text-sm text-parish-400">{cls.publicId}</p>
      </header>
      <p className="mb-6 max-w-2xl text-sm text-parish-500">
        Estes dados são privados e nunca aparecem na área pública. Apenas nome, data de nascimento
        e situação sacramental são armazenados.
      </p>

      <div className="mb-6 flex flex-wrap gap-3">
        <CreatePanel label="+ Adicionar catequizando(a)">
          {(close) => <AddCatechumenForm classId={cls.id} onDone={close} />}
        </CreatePanel>
        <Link
          href={`/admin/turmas/${cls.id}/catequizandos/importar`}
          className="rounded-md border border-parish-300 px-4 py-2 text-sm font-medium text-parish-700 hover:bg-parish-50"
        >
          Importar por Excel/CSV
        </Link>
      </div>

      {cls.catechumens.length === 0 ? (
        <p className="rounded-md border border-dashed border-parish-300 bg-white px-4 py-8 text-center text-sm text-parish-500">
          Nenhuma lista individual cadastrada nesta turma ainda. A quantidade de catequizandos
          exibida no restante do sistema usa o valor informado manualmente no cadastro da turma.
        </p>
      ) : (
        <div className="table-scroll rounded-lg border border-parish-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-parish-100 text-xs uppercase tracking-wide text-parish-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Data de nascimento</th>
                <th className="px-4 py-3 text-center font-semibold">Batismo</th>
                <th className="px-4 py-3 text-center font-semibold">Eucaristia</th>
                <th className="px-4 py-3 text-center font-semibold">Crisma</th>
                <th className="px-4 py-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-parish-100">
              {cls.catechumens.map((c) => (
                <CatechumenRow
                  key={c.id}
                  catechumen={{
                    id: c.id,
                    name: c.name,
                    birthDate: c.birthDate.toISOString(),
                    baptized: c.baptized,
                    firstEucharist: c.firstEucharist,
                    confirmed: c.confirmed,
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
