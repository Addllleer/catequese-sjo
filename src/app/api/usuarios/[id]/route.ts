import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin, ApiError } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { userSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  requireAdmin(user);

  const data = userSchema.partial().parse(await req.json());
  const current = await prisma.user.findUnique({ where: { id: params.id } });
  if (!current) throw new ApiError(404, "Usuário não encontrado.");

  if (data.role === "LEVEL_RESPONSIBLE" && data.responsibleLevelId === undefined && !current.responsibleLevelId) {
    throw new ApiError(422, "Selecione o nível pelo qual este usuário será responsável.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const newLevelId = data.role === "ADMIN" ? null : data.responsibleLevelId ?? current.responsibleLevelId;

    if (newLevelId && newLevelId !== current.responsibleLevelId) {
      const previousHolder = await tx.user.findFirst({ where: { responsibleLevelId: newLevelId } });
      if (previousHolder && previousHolder.id !== current.id) {
        await tx.user.update({ where: { id: previousHolder.id }, data: { responsibleLevelId: null } });
      }
    }

    return tx.user.update({
      where: { id: current.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email.toLowerCase().trim() }),
        ...(data.password && { passwordHash: await bcrypt.hash(data.password, 12) }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.active !== undefined && { active: data.active }),
        responsibleLevelId: newLevelId,
      },
    });
  });

  await logAudit({ user, action: "UPDATE_USER", entityType: "User", entityId: updated.id });

  return NextResponse.json({ id: updated.id, name: updated.name, email: updated.email });
});

export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  requireAdmin(user);

  if (params.id === user.id) {
    throw new ApiError(400, "Você não pode excluir seu próprio usuário enquanto está autenticado com ele.");
  }

  await prisma.user.delete({ where: { id: params.id } });

  await logAudit({ user, action: "DELETE_USER", entityType: "User", entityId: params.id });

  return NextResponse.json({ ok: true });
});
