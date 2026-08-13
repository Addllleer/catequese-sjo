import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin, ApiError } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { levelUpdateSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export const PATCH = apiHandler(async (req, { params }: { params: { slug: string } }) => {
  const user = await requireUser();
  requireAdmin(user);

  const data = levelUpdateSchema.parse(await req.json());
  const level = await prisma.level.findUnique({ where: { slug: params.slug } });
  if (!level) throw new ApiError(404, "Nível não encontrado.");

  const updated = await prisma.level.update({ where: { id: level.id }, data });

  await logAudit({ user, action: "UPDATE_LEVEL", entityType: "Level", entityId: level.id });

  return NextResponse.json(updated);
});
