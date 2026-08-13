import { prisma } from "./prisma";
import type { ClassStatus, Period, Weekday } from "@prisma/client";
import { getCatechumensCount } from "./classStats";
import { WEEKDAY_LABELS } from "./constants";
import { formatTimeRange } from "./format";
import type { ClassTableRow } from "@/components/ClassTable";

export interface QuadroFilters {
  year?: number;
  communityId?: string;
  levelId?: string;
  weekday?: Weekday;
  period?: Period;
  status?: ClassStatus;
  includeArchived: boolean;
}

/**
 * Busca as turmas para o Quadro Geral, aplicando os filtros da tela
 * (especificação, seção 35). Por padrão, turmas concluídas/arquivadas ficam
 * ocultas — a exibição delas é uma opção explícita ("Mostrar
 * concluídas/arquivadas").
 *
 * Interpretação do filtro de ano (decisão técnica não detalhada na
 * especificação): turmas sem ano definido são recorrentes e aparecem em
 * qualquer ano selecionado; turmas com ano de início/fim aparecem apenas
 * quando o ano selecionado está dentro do intervalo de vigência.
 */
export async function fetchQuadroClasses(filters: QuadroFilters) {
  const classes = await prisma.class.findMany({
    where: {
      communityId: filters.communityId || undefined,
      levelId: filters.levelId || undefined,
      weekday: filters.weekday || undefined,
      period: filters.period || undefined,
      status: filters.status
        ? filters.status
        : filters.includeArchived
          ? undefined
          : { not: "CONCLUIDA" },
    },
    include: {
      level: true,
      community: true,
      room: true,
      catechists: { include: { catechist: true } },
      catechumens: { select: { id: true, baptized: true, firstEucharist: true, confirmed: true } },
    },
    orderBy: [{ community: { sigla: "asc" } }, { level: { order: "asc" } }, { weekday: "asc" }],
  });

  if (!filters.year) return classes;

  return classes.filter((c) => {
    if (c.startYear == null && c.endYear == null) return true;
    const start = c.startYear ?? -Infinity;
    const end = c.endYear ?? Infinity;
    return filters.year! >= start && filters.year! <= end;
  });
}

export type QuadroClass = Awaited<ReturnType<typeof fetchQuadroClasses>>[number];

export function groupByCommunity(classes: QuadroClass[]) {
  const map = new Map<string, { community: { id: string; name: string; sigla: string }; classes: QuadroClass[] }>();
  for (const c of classes) {
    const key = c.communityId;
    if (!map.has(key)) {
      map.set(key, { community: c.community, classes: [] });
    }
    map.get(key)!.classes.push(c);
  }
  return Array.from(map.values());
}

export function toTableRow(
  cls: QuadroClass,
  opts: { basePath: string; showCatechists: boolean }
): ClassTableRow {
  return {
    id: cls.id,
    publicId: cls.publicId,
    href: `${opts.basePath}/${cls.id}`,
    levelName: cls.level.name,
    weekdayLabel: WEEKDAY_LABELS[cls.weekday],
    timeRange: formatTimeRange(cls.startTime, cls.endTime),
    roomName: cls.room?.name ?? "",
    catechistNames: opts.showCatechists ? cls.catechists.map((c) => c.catechist.name) : undefined,
    catechumensCount: getCatechumensCount(cls),
    status: cls.status,
  };
}
