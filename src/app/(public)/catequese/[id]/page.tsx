import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCatechumensCount } from "@/lib/classStats";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { WEEKDAY_LABELS, PERIOD_LABELS } from "@/lib/constants";
import { formatTimeRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PublicClassPage({ params }: { params: { id: string } }) {
  const cls = await prisma.class.findUnique({
    where: { id: params.id },
    include: { level: true, community: true, room: true, catechumens: { select: { id: true } } },
  });

  if (!cls) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/catequese" className="text-sm font-medium text-parish-600 hover:text-parish-900">
        ← Voltar ao Quadro Geral
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-2xl font-semibold text-parish-900">
            {cls.level.name} — {cls.community.name}
          </h1>
          <StatusBadge status={cls.status} />
        </div>
        <p className="mt-1 text-sm text-parish-400">{cls.publicId}</p>
      </header>

      <dl className="mt-8 grid grid-cols-1 gap-x-8 gap-y-5 rounded-lg border border-parish-200 bg-white p-6 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-parish-500">Comunidade</dt>
          <dd className="mt-0.5 text-sm text-parish-900">{cls.community.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-parish-500">Nível</dt>
          <dd className="mt-0.5 text-sm text-parish-900">{cls.level.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-parish-500">Período</dt>
          <dd className="mt-0.5 text-sm text-parish-900">{PERIOD_LABELS[cls.period]}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-parish-500">Dia</dt>
          <dd className="mt-0.5 text-sm text-parish-900">{WEEKDAY_LABELS[cls.weekday]}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-parish-500">Horário</dt>
          <dd className="mt-0.5 text-sm text-parish-900">{formatTimeRange(cls.startTime, cls.endTime)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-parish-500">Sala</dt>
          <dd className="mt-0.5 text-sm text-parish-900">{cls.room?.name ?? "A definir"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-parish-500">Catequizandos</dt>
          <dd className="mt-0.5 text-sm text-parish-900">{getCatechumensCount(cls)}</dd>
        </div>
        {(cls.startYear || cls.endYear) && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-parish-500">Vigência</dt>
            <dd className="mt-0.5 text-sm text-parish-900">
              {cls.startYear ?? "—"} a {cls.endYear ?? "em curso"}
            </dd>
          </div>
        )}
      </dl>

      <p className="mt-6 text-xs text-parish-400">
        Nomes de catequistas e informações administrativas não são exibidos nesta área pública.
      </p>
    </div>
  );
}
