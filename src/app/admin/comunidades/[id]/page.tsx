import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { toTableRow } from "@/lib/classQueries";
import { ClassTable } from "@/components/ClassTable";
import { CreatePanel } from "@/components/admin/CreatePanel";
import { AdminEntityForm } from "@/components/admin/AdminEntityForm";
import { EditableEntity } from "@/components/admin/EditableEntity";

export const dynamic = "force-dynamic";

export default async function AdminCommunityDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user) redirect("/login?callbackUrl=/admin/comunidades");
  const isAdmin = session.user.role === "ADMIN";

  const community = await prisma.community.findUnique({
    where: { id: params.id },
    include: { rooms: { orderBy: { name: "asc" } } },
  });
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

  return (
    <div className="max-w-4xl">
      <Link href="/admin/comunidades" className="text-sm font-medium text-parish-600 hover:text-parish-900">
        ← Voltar às comunidades
      </Link>

      <header className="mt-4 mb-8">
        <h1 className="font-serif text-2xl font-semibold text-parish-900">{community.name}</h1>
        <p className="mt-1 text-sm text-parish-500">
          Sigla oficial: <span className="font-mono">{community.sigla}</span>
        </p>
      </header>

      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-parish-900">Salas</h2>
        </div>

        {isAdmin && (
          <div className="mb-4">
            <CreatePanel label="+ Nova sala">
              {(close) => (
                <AdminEntityForm
                  submitLabel="Criar sala"
                  method="POST"
                  action="/api/salas"
                  onSuccess={close}
                  onCancel={close}
                  fixedValues={{ communityId: community.id }}
                  initialValues={{ active: true }}
                  fields={[
                    { name: "name", label: "Nome da sala", type: "text", required: true },
                    { name: "capacity", label: "Capacidade (opcional)", type: "number" },
                  ]}
                />
              )}
            </CreatePanel>
          </div>
        )}

        {community.rooms.length === 0 ? (
          <p className="rounded-md border border-dashed border-parish-300 bg-white px-4 py-6 text-sm text-parish-500">
            Nenhuma sala cadastrada nesta comunidade.
          </p>
        ) : (
          <ul className="divide-y divide-parish-200 rounded-lg border border-parish-200 bg-white">
            {community.rooms.map((room) => (
              <li key={room.id} className="p-4">
                {isAdmin ? (
                  <EditableEntity
                    patchAction={`/api/salas/${room.id}`}
                    deleteAction={`/api/salas/${room.id}`}
                    deleteTitle="Excluir sala"
                    deleteMessage={`Você está prestes a excluir a sala "${room.name}". Esta ação não pode ser desfeita e falhará caso existam turmas vinculadas a esta sala.`}
                    initialValues={{
                      name: room.name,
                      capacity: room.capacity ?? "",
                      active: room.active,
                    }}
                    fields={[
                      { name: "name", label: "Nome da sala", type: "text", required: true },
                      { name: "capacity", label: "Capacidade (opcional)", type: "number" },
                      { name: "active", label: "Sala ativa", type: "checkbox" },
                    ]}
                  >
                    <p className="font-medium text-parish-900">
                      {room.name} {!room.active && <span className="text-xs text-parish-400">(inativa)</span>}
                    </p>
                    {room.capacity && <p className="text-xs text-parish-500">Capacidade: {room.capacity}</p>}
                  </EditableEntity>
                ) : (
                  <p className="font-medium text-parish-900">{room.name}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg font-semibold text-parish-900">Turmas</h2>
        <ClassTable
          communityName={community.name}
          showCatechists
          rows={classes.map((c) => toTableRow(c, { basePath: "/admin/turmas", showCatechists: true }))}
        />
      </section>
    </div>
  );
}
