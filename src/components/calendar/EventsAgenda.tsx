import { EventCategoryBadge } from "@/components/ui/EventCategoryBadge";
import { formatDateLongBR, formatTimeRange } from "@/lib/format";
import { groupEventsByMonth, MONTH_NAMES } from "@/lib/events";
import type { CalendarEvent, Community, Level } from "@prisma/client";

type EventWithRelations = CalendarEvent & { community: Community | null; level: Level | null };

export function EventsAgenda({
  events,
  emptyMessage = "Nenhum evento encontrado para os filtros selecionados.",
}: {
  events: EventWithRelations[];
  emptyMessage?: string;
}) {
  if (events.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-parish-300 bg-white px-4 py-8 text-center text-sm text-parish-500">
        {emptyMessage}
      </p>
    );
  }

  const groups = groupEventsByMonth(events);

  return (
    <div className="space-y-8">
      {groups.map((group) => {
        const [year, month] = group.key.split("-").map(Number);
        return (
          <section key={group.key}>
            <h2 className="mb-3 font-serif text-lg font-semibold text-parish-900">
              {MONTH_NAMES[month - 1]} de {year}
            </h2>
            <ul className="divide-y divide-parish-200 rounded-lg border border-parish-200 bg-white">
              {group.items.map((event) => (
                <li key={event.id} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <EventCategoryBadge category={event.category} />
                    {event.status !== "CONFIRMADO" && (
                      <span className="rounded-full border border-parish-300 px-2 py-0.5 text-xs font-medium text-parish-600">
                        {event.status === "ADIADO" ? "Adiado" : "Cancelado"}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1.5 font-serif text-base font-semibold text-parish-900">
                    {event.title}
                  </h3>
                  <p className="mt-1 text-sm text-parish-600">
                    {formatDateLongBR(event.date)}
                    {event.startTime && event.endTime
                      ? ` · ${formatTimeRange(event.startTime, event.endTime)}`
                      : ""}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                  {(event.community || event.level) && (
                    <p className="mt-1 text-xs text-parish-500">
                      {[event.community?.name, event.level?.name].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {event.description && (
                    <p className="mt-2 text-sm leading-relaxed text-parish-600">{event.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
