import type { Metadata } from "next";
import { fetchEvents } from "@/lib/events";
import { CalendarFilterBar } from "@/components/calendar/CalendarFilterBar";
import { EventsAgenda } from "@/components/calendar/EventsAgenda";
import type { EventCategory } from "@prisma/client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Calendário" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const events = await fetchEvents({
    year: searchParams.ano ? Number(searchParams.ano) : new Date().getFullYear(),
    month: searchParams.mes ? Number(searchParams.mes) : undefined,
    communityId: searchParams.comunidade || undefined,
    levelId: searchParams.nivel || undefined,
    category: (searchParams.categoria as EventCategory) || undefined,
    publicOnly: true,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-parish-900">Calendário</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-parish-600">
          Encontros, celebrações, reuniões e demais atividades da catequese paroquial.
        </p>
      </header>

      <CalendarFilterBar basePath="/calendario" searchParams={searchParams} />
      <EventsAgenda events={events} />
    </div>
  );
}
