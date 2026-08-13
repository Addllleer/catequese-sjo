import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireLevelAccess, ApiError } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { classSchema } from "@/lib/validations";
import { generateClassIdentifier } from "@/lib/classIdentifier";
import { detectClassConflicts } from "@/lib/conflicts";
import { logAudit } from "@/lib/audit";

export const POST = apiHandler(async (req) => {
  const user = await requireUser();
  const data = classSchema.parse(await req.json());

  const level = await prisma.level.findUnique({ where: { id: data.levelId } });
  if (!level) throw new ApiError(422, "Nível inválido.");
  requireLevelAccess(user, level.slug);

  const community = await prisma.community.findUnique({ where: { id: data.communityId } });
  if (!community) throw new ApiError(422, "Comunidade inválida.");

  if (level.usesYearRange && (!data.startYear || !data.endYear)) {
    throw new ApiError(
      422,
      `O nível ${level.name} exige ano de início e ano de término, pois eles fazem parte do identificador da turma.`
    );
  }

  const existing = await prisma.class.findMany({ select: { publicId: true } });
  const publicId = generateClassIdentifier(
    {
      levelSlug: level.slug,
      communitySigla: community.sigla,
      period: data.period,
      usesYearRange: level.usesYearRange,
      startYear: data.startYear,
      endYear: data.endYear,
    },
    existing.map((c) => c.publicId)
  );

  const warnings = await detectClassConflicts({
    communityId: data.communityId,
    roomId: data.roomId,
    weekday: data.weekday,
    startTime: data.startTime,
    endTime: data.endTime,
    catechistIds: data.catechistIds ?? [],
  });

  const cls = await prisma.class.create({
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

  await logAudit({ user, action: "CREATE_CLASS", entityType: "Class", entityId: cls.id, metadata: { publicId } });

  return NextResponse.json({ class: cls, warnings }, { status: 201 });
});
