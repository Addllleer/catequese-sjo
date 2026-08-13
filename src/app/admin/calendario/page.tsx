import { redirect } from "next/navigation";
import { getSession, manageableLevelSlugs } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { fetchEvents } from "@/lib/events";
import { CalendarFilterBar } from "@/components/calendar/CalendarFilterBar";
import { CreatePanel } from "@/components/admin/CreatePanel";
import { AdminEntityForm } from "@/components/admin/AdminEntityForm";
import { EditableEntity } from "@/components/admin/EditableEntity";
import { EventCategoryBadge } from "@/components/ui/EventCategoryBadge";
import { EVENT_CATEGORY_LABELS } from "@/lib/constants";
import { formatDateBR, formatDateInputValue } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/login?callbackUrl=/admin/calendario");
  const user = session.user;
  const allowedSlugs = manageableLevelSlugs(user);

  const [levels, communities] = await Promise.all([
    prisma.level.findMany({ orderBy: { order: "asc" } }),
    prisma.community.findMany({ orderBy: { sigla: "asc" } }),
  ]);
  const levelOptions = (allowedSlugs ? levels.filter((l) => allowedSlugs.includes(l.slug)) : levels).map((l) => ({
    value: l.id,
    label: l.name,
  }));

  const events = await fetchEvents({
    year: searchParams.ano ? Number(searchParams.ano) : new Date().getFullYear(),
    month: searchParams.mes ? Number(searchParams.mes) : undefined,
    communityId: searchParams.comunidade || undefined,
    levelId: searchParams.nivel || undefined,
    category: (searchParams.categoria as any) || undefined,
    publicOnly: false,
  });

  const visibleEvents = allowedSlugs
    ? events.filter((e) => !e.levelId || allowedSlugs.includes(e.level?.slug ?? ""))
    : events;

  const eventFields = [
    { name: "title", label: "Título", type: "text" as const, required: true },
    { name: "description", label: "Descrição", type: "textarea" as const },
    { name: "date", label: "Data", type: "date" as const, required: true },
    { name: "startTime", label: "Horário inicial", type: "time" as const },
    { name: "endTime", label: "Horário final", type: "time" as const },
    { name: "location", label: "Local", type: "text" as const },
    {
      name: "communityId",
      label: "Comunidade (opcional — deixe em branco para todas)",
      type: "select" as const,
      options: communities.map((c) => ({ value: c.id, label: c.name })),
    },
    {
      name: "levelId",
      label: "Nível (opcional — deixe em branco para evento geral)",
      type: "select" as const,
      options: levelOptions,
    },
    {
      name: "category",
      label: "Categoria",
      type: "select" as const,
      required: true,
      options: Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      name: "visibility",
      label: "Visibilidade",
      type: "select" as const,
      options: [
        { value: "PUBLICO", label: "Público" },
        { value: "AUTENTICADO", label: "Somente usuários autenticados" },
      ],
    },
    {
      name: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { value: "CONFIRMADO", label: "Confirmado" },
        { value: "ADIADO", label: "Adiado" },
        { value: "CANCELADO", label: "Cancelado" },
      ],
    },
    { name: "observations", label: "Observações", type: "textarea" as const },
  ];

  return (
    <div className="max-w-5xl">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-parish-900">Calendário</h1>
          <p className="mt-1 text-sm text-parish-500">
            Encontros, celebrações, reuniões e formações da catequese.
          </p>
        </div>
      </header>

      <div className="mb-6">
        <CreatePanel label="+ Novo evento">
          {(close) => (
            <AdminEntityForm
              submitLabel="Criar evento"
              method="POST"
              action="/api/eventos"
              onSuccess={close}
              onCancel={close}
              initialValues={{ visibility: "PUBLICO", status: "CONFIRMADO" }}
              fields={eventFields}
            />
          )}
        </CreatePanel>
      </div>

      <CalendarFilterBar basePath="/admin/calendario" searchParams={searchParams} />

      {visibleEvents.length === 0 ? (
        <p className="rounded-md border border-dashed border-parish-300 bg-white px-4 py-8 text-center text-sm text-parish-500">
          Nenhum evento encontrado para os filtros selecionados.
        </p>
      ) : (
        <ul className="divide-y divide-parish-200 rounded-lg border border-parish-200 bg-white">
          {visibleEvents.map((event) => (
            <li key={event.id} className="p-5">
              <EditableEntity
                patchAction={`/api/eventos/${event.id}`}
                deleteAction={`/api/eventos/${event.id}`}
                deleteTitle="Excluir evento"
                deleteMessage={`Você está prestes a excluir o evento "${event.title}" (${formatDateBR(event.date)}). Esta ação não pode ser desfeita.`}
                initialValues={{
                  title: event.title,
                  description: event.description ?? "",
                  date: formatDateInputValue(event.date),
                  startTime: event.startTime ?? "",
                  endTime: event.endTime ?? "",
                  location: event.location ?? "",
                  communityId: event.communityId ?? "",
                  levelId: event.levelId ?? "",
                  category: event.category,
                  visibility: event.visibility,
                  status: event.status,
                  observations: event.observations ?? "",
                }}
                fields={eventFields}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <EventCategoryBadge category={event.category} />
                  <span className="text-xs text-parish-500">{formatDateBR(event.date)}</span>
                  {event.visibility === "AUTENTICADO" && (
                    <span className="rounded-full border border-parish-300 px-2 py-0.5 text-xs text-parish-600">
                      Somente autenticados
                    </span>
                  )}
                </div>
                <p className="mt-1 font-serif text-base font-semibold text-parish-900">{event.title}</p>
                {(event.community || event.level) && (
                  <p className="text-xs text-parish-500">
                    {[event.community?.name, event.level?.name].filter(Boolean).join(" · ")}
                  </p>
                )}
              </EditableEntity>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
