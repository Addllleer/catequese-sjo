import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin, requireLevelAccess, ApiError } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { calendarEventSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

/**
 * O Administrador gerencia o calendário completo. Um Responsável de Nível
 * só pode criar/editar eventos vinculados ao próprio nível — eventos gerais
 * (sem nível) são reservados ao Administrador (especificação, seção 16/26).
 */
export const POST = apiHandler(async (req) => {
  const user = await requireUser();
  const data = calendarEventSchema.parse(await req.json());

  if (data.levelId) {
    const level = await prisma.level.findUnique({ where: { id: data.levelId } });
    if (!level) throw new ApiError(422, "Nível inválido.");
    requireLevelAccess(user, level.slug);
  } else {
    requireAdmin(user);
  }

  const event = await prisma.calendarEvent.create({
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

  await logAudit({ user, action: "CREATE_EVENT", entityType: "CalendarEvent", entityId: event.id });

  return NextResponse.json(event, { status: 201 });
});
