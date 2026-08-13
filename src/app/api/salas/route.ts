import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { roomSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export const POST = apiHandler(async (req) => {
  const user = await requireUser();
  requireAdmin(user);

  const data = roomSchema.parse(await req.json());
  const room = await prisma.room.create({ data });

  await logAudit({ user, action: "CREATE_ROOM", entityType: "Room", entityId: room.id });

  return NextResponse.json(room, { status: 201 });
});
