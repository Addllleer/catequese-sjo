import { prisma } from "./prisma";
import type { Weekday } from "@prisma/client";

/** true se os intervalos [aStart,aEnd) e [bStart,bEnd) se sobrepõem. */
function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export interface ConflictCheckInput {
  classId?: string; // ignorar a própria turma ao editar
  communityId: string;
  roomId?: string | null;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  catechistIds: string[];
}

export interface ConflictWarning {
  type: "SALA" | "CATEQUISTA";
  message: string;
}

/**
 * Verifica conflitos de sala (mesma sala, mesmo dia, horário sobreposto) e
 * de catequista (mesmo catequista em duas turmas no mesmo horário).
 * Não bloqueia o cadastro — apenas retorna alertas para o administrador
 * decidir, conforme a especificação ("não bloquear obrigatoriamente todos
 * os conflitos, mas alertar claramente").
 */
export async function detectClassConflicts(input: ConflictCheckInput): Promise<ConflictWarning[]> {
  const warnings: ConflictWarning[] = [];

  const candidateClasses = await prisma.class.findMany({
    where: {
      id: input.classId ? { not: input.classId } : undefined,
      weekday: input.weekday,
      status: { not: "CONCLUIDA" },
      OR: [
        input.roomId ? { roomId: input.roomId } : undefined,
        input.catechistIds.length > 0
          ? { catechists: { some: { catechistId: { in: input.catechistIds } } } }
          : undefined,
      ].filter(Boolean) as any,
    },
    include: {
      room: true,
      catechists: { include: { catechist: true } },
    },
  });

  for (const other of candidateClasses) {
    const overlap = timesOverlap(input.startTime, input.endTime, other.startTime, other.endTime);
    if (!overlap) continue;

    if (input.roomId && other.roomId === input.roomId) {
      warnings.push({
        type: "SALA",
        message: `Conflito de horário: a sala "${other.room?.name ?? ""}" já está reservada neste período pela turma ${other.publicId}.`,
      });
    }

    const sharedCatechists = other.catechists
      .map((c) => c.catechist)
      .filter((c) => input.catechistIds.includes(c.id));

    for (const catechist of sharedCatechists) {
      warnings.push({
        type: "CATEQUISTA",
        message: `O(a) catequista ${catechist.name} já está associado(a) à turma ${other.publicId} neste mesmo horário.`,
      });
    }
  }

  return warnings;
}
