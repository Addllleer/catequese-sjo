import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCatechumensCount } from "@/lib/classStats";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Comunidades" };

export default async function CommunitiesPage() {
  const communities = await prisma.community.findMany({
    orderBy: { sigla: "asc" },
    include: {
      rooms: { select: { id: true } },
      classes: {
        where: { status: { not: "CONCLUIDA" } },
        select: {
          id: true,
          status: true,
          catechumensCountOverride: true,
          catechumens: { select: { id: true } },
          level: { select: { name: true } },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-parish-900">Comunidades</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-parish-600">
          A Paróquia São José Operário possui catequese em três comunidades.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {communities.map((community) => {
          const activeClasses = community.classes.filter((c) => c.status === "ATIVA");
          const catechumensTotal = community.classes.reduce(
            (sum, c) => sum + getCatechumensCount(c),
            0
          );
          const levelNames = Array.from(new Set(community.classes.map((c) => c.level.name)));

          return (
            <Link
              key={community.id}
              href={`/comunidades/${community.sigla}`}
              className="flex flex-col rounded-lg border border-parish-200 bg-white p-6 transition hover:border-gold-400 hover:shadow-sm"
            >
              <h2 className="font-serif text-lg font-semibold text-parish-900">{community.name}</h2>
              <dl className="mt-4 space-y-1.5 text-sm text-parish-600">
                <div className="flex justify-between">
                  <dt>Turmas ativas</dt>
                  <dd className="font-medium text-parish-900">{activeClasses.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Catequizandos</dt>
                  <dd className="font-medium text-parish-900">{catechumensTotal}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Salas</dt>
                  <dd className="font-medium text-parish-900">{community.rooms.length}</dd>
                </div>
              </dl>
              {levelNames.length > 0 && (
                <p className="mt-4 text-xs text-parish-500">
                  Níveis atendidos: {levelNames.join(", ")}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
