import { prisma } from "./prisma";
import type { EventCategory, Prisma } from "@prisma/client";

export interface EventFilters {
  year?: number;
  month?: number; // 1-12
  communityId?: string;
  levelId?: string;
  category?: EventCategory;
  publicOnly: boolean;
}

export async function fetchEvents(filters: EventFilters) {
  const where: Prisma.CalendarEventWhereInput = {
    communityId: filters.communityId || undefined,
    levelId: filters.levelId || undefined,
    category: filters.category || undefined,
    visibility: filters.publicOnly ? "PUBLICO" : undefined,
  };

  if (filters.year) {
    const month = filters.month;
    const start = new Date(Date.UTC(filters.year, month ? month - 1 : 0, 1));
    const end = month
      ? new Date(Date.UTC(filters.year, month, 1))
      : new Date(Date.UTC(filters.year + 1, 0, 1));
    where.date = { gte: start, lt: end };
  }

  return prisma.calendarEvent.findMany({
    where,
    include: { community: true, level: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export function groupEventsByMonth<T extends { date: Date }>(events: T[]) {
  const map = new Map<string, T[]>();
  for (const e of events) {
    const key = `${e.date.getUTCFullYear()}-${String(e.date.getUTCMonth() + 1).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
}

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export async function fetchUpcomingEvents(opts: { limit: number; levelId?: string; publicOnly?: boolean }) {
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  return prisma.calendarEvent.findMany({
    where: {
      date: { gte: startOfToday },
      levelId: opts.levelId,
      visibility: opts.publicOnly ? "PUBLICO" : undefined,
    },
    include: { community: true, level: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take: opts.limit,
  });
}
