import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin, ApiError } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { logAudit } from "@/lib/audit";

/**
 * Define (ou remove) o responsável principal de um nível.
 *
 * Regra de negócio (especificação, seção 51): o sistema não deve permitir
 * mais de um responsável principal por nível ao mesmo tempo. Isso é
 * garantido em dois níveis: a restrição UNIQUE em User.responsibleLevelId
 * no banco, e a transação abaixo, que primeiro libera o responsável
 * anterior (se houver) antes de designar o novo.
 */
export const PUT = apiHandler(async (req, { params }: { params: { slug: string } }) => {
  const user = await requireUser();
  requireAdmin(user);

  const body = z.object({ userId: z.string().nullable() }).parse(await req.json());

  const level = await prisma.level.findUnique({ where: { slug: params.slug } });
  if (!level) throw new ApiError(404, "Nível não encontrado.");

  if (body.userId) {
    const candidate = await prisma.user.findUnique({ where: { id: body.userId } });
    if (!candidate) throw new ApiError(404, "Usuário não encontrado.");
    if (!candidate.active) throw new ApiError(422, "Não é possível designar um usuário inativo como responsável.");
  }

  const currentResponsible = await prisma.user.findFirst({ where: { responsibleLevelId: level.id } });

  await prisma.$transaction(async (tx) => {
    if (currentResponsible && currentResponsible.id !== body.userId) {
      await tx.user.update({ where: { id: currentResponsible.id }, data: { responsibleLevelId: null } });
    }
    if (body.userId) {
      await tx.user.update({
        where: { id: body.userId },
        data: { responsibleLevelId: level.id, role: "LEVEL_RESPONSIBLE" },
      });
    }
  });

  await logAudit({
    user,
    action: "ASSIGN_LEVEL_RESPONSIBLE",
    entityType: "Level",
    entityId: level.id,
    metadata: { userId: body.userId },
  });

  return NextResponse.json({ ok: true });
});
