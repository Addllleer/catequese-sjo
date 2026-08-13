import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin, requireLevelAccess, ApiError } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { calendarEventSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

async function checkAccess(user: Awaited<ReturnType<typeof requireUser>>, levelId: string | null) {
  if (levelId) {
    const level = await prisma.level.findUnique({ where: { id: levelId } });
    if (!level) throw new ApiError(422, "Nível inválido.");
    requireLevelAccess(user, level.slug);
  } else {
    requireAdmin(user);
  }
}

export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const data = calendarEventSchema.parse(await req.json());

  const current = await prisma.calendarEvent.findUnique({ where: { id: params.id } });
  if (!current) throw new ApiError(404, "Evento não encontrado.");

  await checkAccess(user, current.levelId); // acesso ao nível atual
  await checkAccess(user, data.levelId ?? null); // e ao nível de destino, se estiver mudando

  const updated = await prisma.calendarEvent.update({
    where: { id: current.id },
    data: {
      title: data.title,
      description: data.description || null,
      date: new Date(data.date),
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      location: data.location || null,
      communityId: data.communityId || null,
      levelId: data.levelId || null,
      category: data.category,
      visibility: data.visibility,
      status: data.status,
      observations: data.observations || null,
    },
  });

  await logAudit({ user, action: "UPDATE_EVENT", entityType: "CalendarEvent", entityId: updated.id });

  return NextResponse.json(updated);
});

export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  const user = await requireUser();

  const current = await prisma.calendarEvent.findUnique({ where: { id: params.id } });
  if (!current) throw new ApiError(404, "Evento não encontrado.");
  await checkAccess(user, current.levelId);

  await prisma.calendarEvent.delete({ where: { id: current.id } });

  await logAudit({ user, action: "DELETE_EVENT", entityType: "CalendarEvent", entityId: current.id });

  return NextResponse.json({ ok: true });
});
