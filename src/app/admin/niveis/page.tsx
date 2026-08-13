import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AssignResponsibleForm } from "@/components/admin/AssignResponsibleForm";

export const dynamic = "force-dynamic";

export default async function AdminLevelsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login?callbackUrl=/admin/niveis");
  const isAdmin = session.user.role === "ADMIN";

  const [levels, users] = await Promise.all([
    prisma.level.findMany({
      orderBy: { order: "asc" },
      include: { responsible: { select: { id: true, name: true, email: true } } },
    }),
    isAdmin ? prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" } }) : Promise.resolve([]),
  ]);

  return (
    <div className="max-w-4xl">
      <header className="mb-8">
        <h1 className="font-serif text-2xl font-semibold text-parish-900">Níveis de Catequese</h1>
        <p className="mt-1 text-sm text-parish-500">
          Cada nível possui exatamente um responsável principal, que passa a ter acesso
          administrativo completo àquele nível.
        </p>
      </header>

      <ul className="divide-y divide-parish-200 rounded-lg border border-parish-200 bg-white">
        {levels.map((level) => (
          <li key={level.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link
                  href={`/admin/niveis/${level.slug}`}
                  className="font-serif text-lg font-semibold text-parish-900 hover:underline"
                >
                  {level.name}
                </Link>
                <p className="mt-1 max-w-xl text-sm text-parish-600">{level.description}</p>
                <p className="mt-2 text-xs text-parish-500">
                  Responsável atual:{" "}
                  {level.responsible ? (
                    <span className="font-medium text-parish-800">
                      {level.responsible.name} ({level.responsible.email})
                    </span>
                  ) : (
                    <span className="italic">nenhum definido</span>
                  )}
                </p>
              </div>
            </div>

            {isAdmin && (
              <div className="mt-3">
                <AssignResponsibleForm
                  levelSlug={level.slug}
                  currentUserId={level.responsible?.id ?? null}
                  users={users}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
