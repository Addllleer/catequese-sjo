import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession, canManageLevel } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCatechumensCount, hasIndividualList, computeSacramentIndicators } from "@/lib/classStats";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { WEEKDAY_LABELS, PERIOD_LABELS } from "@/lib/constants";
import { formatTimeRange } from "@/lib/format";
import { ClassActions } from "@/components/turmas/ClassActions";

export const dynamic = "force-dynamic";

export default async function AdminClassDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user) redirect(`/login?callbackUrl=/admin/turmas/${params.id}`);
  const user = session.user;

  const cls = await prisma.class.findUnique({
    where: { id: params.id },
    include: {
      level: true,
      community: true,
      room: true,
      catechists: { include: { catechist: true } },
      catechumens: true,
      yearRecords: {
        include: { room: true, catechists: { include: { catechist: true } } },
        orderBy: { year: "desc" },
      },
    },
  });
  if (!cls) notFound();

  const canManage = canManageLevel(user, cls.level.slug);
  if (!canManage) {
    return (
      <div className="max-w-2xl">
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Você não tem permissão para administrar esta turma.
        </p>
      </div>
    );
  }

  const [rooms, catechists] = await Promise.all([
    prisma.room.findMany({ where: { communityId: cls.communityId }, orderBy: { name: "asc" } }),
    prisma.catechist.findMany({ orderBy: { name: "asc" } }),
  ]);

  const indicators = computeSacramentIndicators(cls.catechumens);
  const hasList = hasIndividualList(cls);

  return (
    <div className="max-w-4xl">
      <Link href="/admin/turmas" className="text-sm font-medium text-parish-600 hover:text-parish-900">
        ← Voltar às turmas
      </Link>

      <header className="mt-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-2xl font-semibold text-parish-900">
            {cls.level.name} — {cls.community.name}
          </h1>
          <StatusBadge status={cls.status} />
        </div>
        <p className="mt-1 font-mono text-sm text-parish-400">{cls.publicId}</p>
      </header>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href={`/admin/turmas/${cls.id}/editar`}
          className="rounded-md bg-parish-800 px-4 py-2 text-sm font-medium text-white hover:bg-parish-900"
        >
          Editar turma
        </Link>
        <Link
          href={`/admin/turmas/${cls.id}/catequizandos`}
          className="rounded-md border border-parish-300 px-4 py-2 text-sm font-medium text-parish-700 hover:bg-parish-50"
        >
          Gerenciar catequizandos
        </Link>
      </div>

      <dl className="mb-8 grid grid-cols-1 gap-x-8 gap-y-5 rounded-lg border border-parish-200 bg-white p-6 sm:grid-cols-2">
        <Field label="Comunidade" value={cls.community.name} />
        <Field label="Nível" value={cls.level.name} />
        <Field label="Período" value={PERIOD_LABELS[cls.period]} />
        <Field label="Dia" value={WEEKDAY_LABELS[cls.weekday]} />
        <Field label="Horário" value={formatTimeRange(cls.startTime, cls.endTime)} />
        <Field label="Sala" value={cls.room?.name ?? "A definir"} />
        <Field label="Catequizandos" value={String(getCatechumensCount(cls))} />
        {(cls.startYear || cls.endYear) && (
          <Field label="Vigência" value={`${cls.startYear ?? "—"} a ${cls.endYear ?? "em curso"}`} />
        )}
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-parish-500">Catequistas</dt>
          <dd className="mt-0.5 text-sm text-parish-900">
            {cls.catechists.length > 0 ? cls.catechists.map((c) => c.catechist.name).join(", ") : "Nenhum(a) associado(a)"}
          </dd>
        </div>
        {cls.notes && (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-parish-500">Observações</dt>
            <dd className="mt-0.5 text-sm text-parish-900">{cls.notes}</dd>
          </div>
        )}
      </dl>

      <section className="mb-8">
        <h2 className="mb-3 font-serif text-lg font-semibold text-parish-900">Indicadores sacramentais</h2>
        {!hasList ? (
          <p className="rounded-md border border-dashed border-parish-300 bg-white px-4 py-4 text-sm text-parish-500">
            Esta turma ainda não possui lista individual de catequizandos cadastrada, portanto os
            indicadores sacramentais não podem ser calculados. A quantidade exibida (
            {getCatechumensCount(cls)}) é o valor informado manualmente.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <IndicatorCard label="Batizados" value={indicators.baptized} />
            <IndicatorCard label="Não batizados" value={indicators.notBaptized} />
            <IndicatorCard label="Com Eucaristia" value={indicators.firstEucharist} />
            <IndicatorCard label="Sem Eucaristia" value={indicators.notFirstEucharist} />
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-serif text-lg font-semibold text-parish-900">Ações</h2>
        <ClassActions
          classId={cls.id}
          publicId={cls.publicId}
          status={cls.status}
          catechumensCount={cls.catechumens.length}
          hasHistory={cls.yearRecords.length > 0}
          rooms={rooms}
          catechists={catechists}
        />
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg font-semibold text-parish-900">Histórico por ano</h2>
        {cls.yearRecords.length === 0 ? (
          <p className="rounded-md border border-dashed border-parish-300 bg-white px-4 py-4 text-sm text-parish-500">
            Nenhum registro histórico por ano ainda. Use "Registrar ano no histórico" para preservar
            sala, catequistas e quantidade vigentes em cada ano da turma.
          </p>
        ) : (
          <ol className="space-y-3 border-l-2 border-parish-200 pl-5">
            {cls.yearRecords.map((record) => (
              <li key={record.id} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-gold-500" />
                <p className="font-serif text-base font-semibold text-parish-900">{record.year}</p>
                <p className="text-sm text-parish-600">
                  Sala: {record.room?.name ?? "—"} · Catequizandos: {record.catechumensCount ?? "—"}
                </p>
                {record.catechists.length > 0 && (
                  <p className="text-sm text-parish-600">
                    Catequistas: {record.catechists.map((c) => c.catechist.name).join(", ")}
                  </p>
                )}
                {record.notes && <p className="mt-1 text-xs text-parish-500">{record.notes}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-parish-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-parish-900">{value}</dd>
    </div>
  );
}

function IndicatorCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-parish-200 bg-white p-4">
      <p className="text-2xl font-semibold text-parish-900">{value}</p>
      <p className="mt-0.5 text-xs text-parish-500">{label}</p>
    </div>
  );
}
