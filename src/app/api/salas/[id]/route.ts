import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin, ApiError } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { roomSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  requireAdmin(user);

  const data = roomSchema.partial().parse(await req.json());
  const room = await prisma.room.update({ where: { id: params.id }, data });

  await logAudit({ user, action: "UPDATE_ROOM", entityType: "Room", entityId: room.id });

  return NextResponse.json(room);
});

export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  requireAdmin(user);

  try {
    await prisma.room.delete({ where: { id: params.id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      throw new ApiError(409, "Não é possível excluir esta sala porque existem turmas vinculadas a ela. Marque-a como inativa em vez de excluí-la.");
    }
    throw err;
  }

  await logAudit({ user, action: "DELETE_ROOM", entityType: "Room", entityId: params.id });

  return NextResponse.json({ ok: true });
});
