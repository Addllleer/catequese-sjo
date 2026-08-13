import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin, ApiError } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { communitySchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  requireAdmin(user);

  const data = communitySchema.partial().parse(await req.json());
  const community = await prisma.community.update({ where: { id: params.id }, data });

  await logAudit({ user, action: "UPDATE_COMMUNITY", entityType: "Community", entityId: community.id });

  return NextResponse.json(community);
});

export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  requireAdmin(user);

  try {
    await prisma.community.delete({ where: { id: params.id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      throw new ApiError(
        409,
        "Não é possível excluir esta comunidade porque existem salas ou turmas vinculadas a ela."
      );
    }
    throw err;
  }

  await logAudit({ user, action: "DELETE_COMMUNITY", entityType: "Community", entityId: params.id });

  return NextResponse.json({ ok: true });
});
