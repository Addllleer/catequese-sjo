import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireLevelAccess, ApiError } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { logAudit } from "@/lib/audit";

const schema = z.object({ status: z.enum(["ATIVA", "PLANEJAMENTO", "CONCLUIDA"]) });

/**
 * Atalho para arquivar/reativar uma turma sem reenviar o formulário
 * completo. Turmas concluídas/arquivadas continuam disponíveis para
 * consulta histórica — apenas ficam ocultas das visões principais por
 * padrão (especificação, seções 12/59).
 */
export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const { status } = schema.parse(await req.json());

  const current = await prisma.class.findUnique({ where: { id: params.id }, include: { level: true } });
  if (!current) throw new ApiError(404, "Turma não encontrada.");
  requireLevelAccess(user, current.level.slug);

  const updated = await prisma.class.update({ where: { id: current.id }, data: { status } });

  await logAudit({
    user,
    action: "CHANGE_CLASS_STATUS",
    entityType: "Class",
    entityId: current.id,
    metadata: { from: current.status, to: status },
  });

  return NextResponse.json(updated);
});
