import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireLevelAccess, ApiError } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { classSchema } from "@/lib/validations";
import { generateClassIdentifier } from "@/lib/classIdentifier";
import { detectClassConflicts } from "@/lib/conflicts";
import { logAudit } from "@/lib/audit";

export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const data = classSchema.parse(await req.json());

  const current = await prisma.class.findUnique({ where: { id: params.id }, include: { level: true } });
  if (!current) throw new ApiError(404, "Turma não encontrada.");
  requireLevelAccess(user, current.level.slug);

  const level = await prisma.level.findUnique({ where: { id: data.levelId } });
  if (!level) throw new ApiError(422, "Nível inválido.");
  requireLevelAccess(user, level.slug); // também exige acesso ao nível de destino, se estiver mudando

  const community = await prisma.community.findUnique({ where: { id: data.communityId } });
  if (!community) throw new ApiError(422, "Comunidade inválida.");

  if (level.usesYearRange && (!data.startYear || !data.endYear)) {
    throw new ApiError(422, `O nível ${level.name} exige ano de início e ano de término.`);
  }

  // Recalcula o identificador legível somente se algum componente relevante
  // mudou — a chave técnica (id) nunca muda (especificação, seção 10).
  let publicId = current.publicId;
  const identifierChanged =
    current.levelId !== data.levelId ||
    current.communityId !== data.communityId ||
    current.period !== data.period ||
    current.startYear !== (data.startYear ?? null) ||
    current.endYear !== (data.endYear ?? null);

  if (identifierChanged) {
    const others = await prisma.class.findMany({
      where: { id: { not: current.id } },
      select: { publicId: true },
    });
    publicId = generateClassIdentifier(
      {
        levelSlug: level.slug,
        communitySigla: community.sigla,
        period: data.period,
        usesYearRange: level.usesYearRange,
        startYear: data.startYear,
        endYear: data.endYear,
      },
      others.map((c) => c.publicId)
    );
  }

  const warnings = await detectClassConflicts({
    classId: current.id,
    communityId: data.communityId,
    roomId: data.roomId,
    weekday: data.weekday,
    startTime: data.startTime,
    endTime: data.endTime,
    catechistIds: data.catechistIds ?? [],
  });

  const updated = await prisma.$transaction(async (tx) => {
    await tx.catechistOnClass.deleteMany({ where: { classId: current.id } });
    return tx.class.update({
      where: { id: current.id },
      data: {
        publicId,
        levelId: data.levelId,
        communityId: data.communityId,
        period: data.period,
        weekday: data.weekday,
        startTime: data.startTime,
        endTime: data.endTime,
        roomId: data.roomId || null,
        status: data.status,
        startYear: data.startYear ?? null,
        endYear: data.endYear ?? null,
        catechumensCountOverride: data.catechumensCountOverride ?? null,
        notes: data.notes ?? null,
        catechists: data.catechistIds?.length
          ? { create: data.catechistIds.map((catechistId) => ({ catechistId })) }
          : undefined,
      },
    });
  });

  await logAudit({ user, action: "UPDATE_CLASS", entityType: "Class", entityId: updated.id, metadata: { publicId } });

  return NextResponse.json({ class: updated, warnings });
});

export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  const user = await requireUser();

  const current = await prisma.class.findUnique({ where: { id: params.id }, include: { level: true } });
  if (!current) throw new ApiError(404, "Turma não encontrada.");
  requireLevelAccess(user, current.level.slug);

  await prisma.class.delete({ where: { id: current.id } });

  await logAudit({
    user,
    action: "DELETE_CLASS",
    entityType: "Class",
    entityId: current.id,
    metadata: { publicId: current.publicId },
  });

  return NextResponse.json({ ok: true });
});
