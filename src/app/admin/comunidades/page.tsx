import Link from "next/link";
import { getSession } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCatechumensCount } from "@/lib/classStats";
import { CreatePanel } from "@/components/admin/CreatePanel";
import { AdminEntityForm } from "@/components/admin/AdminEntityForm";

export const dynamic = "force-dynamic";

export default async function AdminCommunitiesPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login?callbackUrl=/admin/comunidades");
  const isAdmin = session.user.role === "ADMIN";

  const communities = await prisma.community.findMany({
    orderBy: { sigla: "asc" },
    include: {
      rooms: { select: { id: true } },
      classes: {
        where: { status: { not: "CONCLUIDA" } },
        select: { id: true, status: true, catechumensCountOverride: true, catechumens: { select: { id: true } } },
      },
    },
  });

  return (
    <div className="max-w-4xl">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-parish-900">Comunidades</h1>
          <p className="mt-1 text-sm text-parish-500">
            São José Operário, Santa Cruz e São Gabriel Arcanjo. Não existe responsável por comunidade.
          </p>
        </div>
      </header>

      {isAdmin && (
        <div className="mb-6">
          <CreatePanel label="+ Nova comunidade">
            {(close) => (
              <AdminEntityForm
                submitLabel="Criar comunidade"
                method="POST"
                action="/api/comunidades"
                onSuccess={close}
                onCancel={close}
                fields={[
                  { name: "name", label: "Nome", type: "text", required: true },
                  {
                    name: "sigla",
                    label: "Sigla",
                    type: "text",
                    required: true,
                    help: "Apenas letras minúsculas, ex.: sjop, stcz, sgab.",
                  },
                ]}
              />
            )}
          </CreatePanel>
        </div>
      )}

      <ul className="divide-y divide-parish-200 rounded-lg border border-parish-200 bg-white">
        {communities.map((community) => {
          const activeCount = community.classes.filter((c) => c.status === "ATIVA").length;
          const catechumensTotal = community.classes.reduce((sum, c) => sum + getCatechumensCount(c), 0);
          return (
            <li key={community.id} className="p-5">
              <Link href={`/admin/comunidades/${community.id}`} className="block">
                <h2 className="font-serif text-lg font-semibold text-parish-900">{community.name}</h2>
                <p className="mt-1 text-sm text-parish-500">
                  Sigla: <span className="font-mono">{community.sigla}</span> · {activeCount} turma(s) ativa(s) ·{" "}
                  {community.rooms.length} sala(s) · {catechumensTotal} catequizando(s)
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
