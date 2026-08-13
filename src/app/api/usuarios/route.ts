import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin, ApiError } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { userSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export const POST = apiHandler(async (req) => {
  const user = await requireUser();
  requireAdmin(user);

  const data = userSchema.parse(await req.json());
  if (!data.password) {
    throw new ApiError(422, "Informe uma senha para o novo usuário.");
  }
  if (data.role === "LEVEL_RESPONSIBLE" && !data.responsibleLevelId) {
    throw new ApiError(422, "Selecione o nível pelo qual este usuário será responsável.");
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase().trim() } });
  if (existing) throw new ApiError(409, "Já existe um usuário com este e-mail.");

  const passwordHash = await bcrypt.hash(data.password, 12);

  const created = await prisma.$transaction(async (tx) => {
    // Garante que nunca haja dois responsáveis principais para o mesmo nível
    // ao mesmo tempo (especificação, seção 51).
    if (data.role === "LEVEL_RESPONSIBLE" && data.responsibleLevelId) {
      const previousHolder = await tx.user.findFirst({ where: { responsibleLevelId: data.responsibleLevelId } });
      if (previousHolder) {
        await tx.user.update({ where: { id: previousHolder.id }, data: { responsibleLevelId: null } });
      }
    }

    return tx.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase().trim(),
        passwordHash,
        role: data.role,
        responsibleLevelId: data.role === "LEVEL_RESPONSIBLE" ? data.responsibleLevelId : null,
        active: data.active ?? true,
      },
    });
  });

  await logAudit({ user, action: "CREATE_USER", entityType: "User", entityId: created.id });

  return NextResponse.json({ id: created.id, name: created.name, email: created.email }, { status: 201 });
});
