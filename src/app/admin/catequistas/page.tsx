import { redirect } from "next/navigation";
import { getSession } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CreatePanel } from "@/components/admin/CreatePanel";
import { AdminEntityForm } from "@/components/admin/AdminEntityForm";
import { EditableEntity } from "@/components/admin/EditableEntity";

export const dynamic = "force-dynamic";

export default async function AdminCatechistsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login?callbackUrl=/admin/catequistas");
  const isAdmin = session.user.role === "ADMIN";

  const catechists = await prisma.catechist.findMany({
    orderBy: { name: "asc" },
    include: {
      classes: {
        include: { class: { include: { level: true, community: true } } },
      },
    },
  });

  return (
    <div className="max-w-5xl">
      <header className="mb-8">
        <h1 className="font-serif text-2xl font-semibold text-parish-900">Catequistas</h1>
        <p className="mt-1 text-sm text-parish-500">
          Lista completa de catequistas da paróquia. Um(a) mesmo(a) catequista pode atuar em
          várias turmas, níveis e comunidades. Catequistas não possuem login neste sistema.
        </p>
      </header>

      <div className="mb-6">
        <CreatePanel label="+ Novo(a) catequista">
          {(close) => (
            <AdminEntityForm
              submitLabel="Cadastrar catequista"
              method="POST"
              action="/api/catequistas"
              onSuccess={close}
              onCancel={close}
              fields={[{ name: "name", label: "Nome completo", type: "text", required: true }]}
            />
          )}
        </CreatePanel>
      </div>

      <div className="table-scroll rounded-lg border border-parish-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-parish-100 text-xs uppercase tracking-wide text-parish-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Nome</th>
              <th className="px-4 py-3 font-semibold">Nível(is)</th>
              <th className="px-4 py-3 font-semibold">Comunidade(s)</th>
              <th className="px-4 py-3 font-semibold">Turmas</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-parish-100">
            {catechists.map((catechist) => {
              const levels = Array.from(new Set(catechist.classes.map((c) => c.class.level.name)));
              const communities = Array.from(new Set(catechist.classes.map((c) => c.class.community.name)));
              return (
                <tr key={catechist.id} className="align-top hover:bg-parish-50">
                  <td className="px-4 py-3 font-medium text-parish-900">{catechist.name}</td>
                  <td className="px-4 py-3 text-parish-600">{levels.join(", ") || "—"}</td>
                  <td className="px-4 py-3 text-parish-600">{communities.join(", ") || "—"}</td>
                  <td className="px-4 py-3 text-parish-600">{catechist.classes.length}</td>
                  <td className="px-4 py-3">
                    {catechist.active ? (
                      <span className="text-green-700">Ativo(a)</span>
                    ) : (
                      <span className="text-parish-400">Inativo(a)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <EditableEntity
                      patchAction={`/api/catequistas/${catechist.id}`}
                      deleteAction={isAdmin ? `/api/catequistas/${catechist.id}` : undefined}
                      deleteTitle="Excluir catequista"
                      deleteMessage={`Você está prestes a excluir "${catechist.name}" permanentemente. Esta ação não pode ser desfeita.`}
                      initialValues={{ name: catechist.name, active: catechist.active }}
                      fields={[
                        { name: "name", label: "Nome completo", type: "text", required: true },
                        { name: "active", label: "Catequista ativo(a)", type: "checkbox" },
                      ]}
                    >
                      <span className="sr-only">{catechist.name}</span>
                    </EditableEntity>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
