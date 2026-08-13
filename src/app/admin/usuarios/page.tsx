import { redirect } from "next/navigation";
import { getSession, requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CreatePanel } from "@/components/admin/CreatePanel";
import { AdminEntityForm } from "@/components/admin/AdminEntityForm";
import { EditableEntity } from "@/components/admin/EditableEntity";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login?callbackUrl=/admin/usuarios");

  try {
    requireAdmin(session.user);
  } catch {
    return (
      <div className="max-w-2xl">
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Esta área é exclusiva do Responsável Paroquial.
        </p>
      </div>
    );
  }

  const [users, levels] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" }, include: { responsibleLevel: true } }),
    prisma.level.findMany({ orderBy: { order: "asc" } }),
  ]);

  const userFields = [
    { name: "name", label: "Nome completo", type: "text" as const, required: true },
    { name: "email", label: "E-mail", type: "email" as const, required: true },
    {
      name: "role",
      label: "Perfil",
      type: "select" as const,
      required: true,
      options: [
        { value: "ADMIN", label: "Administrador (Responsável Paroquial)" },
        { value: "LEVEL_RESPONSIBLE", label: "Responsável de Nível" },
      ],
    },
    {
      name: "responsibleLevelId",
      label: "Nível sob responsabilidade (obrigatório se o perfil for Responsável de Nível)",
      type: "select" as const,
      options: levels.map((l) => ({ value: l.id, label: l.name })),
    },
    { name: "active", label: "Usuário ativo", type: "checkbox" as const },
  ];

  return (
    <div className="max-w-4xl">
      <header className="mb-8">
        <h1 className="font-serif text-2xl font-semibold text-parish-900">Usuários e Responsáveis</h1>
        <p className="mt-1 text-sm text-parish-500">
          Cada nível pode ter apenas um responsável principal por vez. Catequistas não possuem
          usuário — apenas Administrador e Responsáveis de Nível fazem login neste sistema.
        </p>
      </header>

      <div className="mb-6">
        <CreatePanel label="+ Novo usuário">
          {(close) => (
            <AdminEntityForm
              submitLabel="Criar usuário"
              method="POST"
              action="/api/usuarios"
              onSuccess={close}
              onCancel={close}
              initialValues={{ role: "LEVEL_RESPONSIBLE", active: true }}
              fields={[
                ...userFields,
                { name: "password", label: "Senha provisória", type: "password" as const, required: true, help: "Mínimo de 8 caracteres. Compartilhe com o usuário por um canal seguro." },
              ]}
            />
          )}
        </CreatePanel>
      </div>

      <ul className="divide-y divide-parish-200 rounded-lg border border-parish-200 bg-white">
        {users.map((u) => (
          <li key={u.id} className="p-5">
            <EditableEntity
              patchAction={`/api/usuarios/${u.id}`}
              deleteAction={`/api/usuarios/${u.id}`}
              deleteTitle="Excluir usuário"
              deleteMessage={`Você está prestes a excluir permanentemente o acesso de "${u.name}". Esta ação não pode ser desfeita.`}
              initialValues={{
                name: u.name,
                email: u.email,
                role: u.role,
                responsibleLevelId: u.responsibleLevelId ?? "",
                active: u.active,
              }}
              fields={userFields}
            >
              <p className="font-medium text-parish-900">
                {u.name} {!u.active && <span className="text-xs text-parish-400">(inativo)</span>}
              </p>
              <p className="text-sm text-parish-500">{u.email}</p>
              <p className="mt-1 text-xs text-parish-500">
                {u.role === "ADMIN" ? "Responsável Paroquial" : `Responsável — ${u.responsibleLevel?.name ?? "nível não definido"}`}
              </p>
            </EditableEntity>
          </li>
        ))}
      </ul>
    </div>
  );
}
