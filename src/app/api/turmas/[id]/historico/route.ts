import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireLevelAccess, ApiError } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { logAudit } from "@/lib/audit";

const yearRecordSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  roomId: z.string().nullable().optional(),
  catechumensCount: z.number().int().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
  catechistIds: z.array(z.string()).optional(),
});

export const POST = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const data = yearRecordSchema.parse(await req.json());

  const cls = await prisma.class.findUnique({ where: { id: params.id }, include: { level: true } });
  if (!cls) throw new ApiError(404, "Turma não encontrada.");
  requireLevelAccess(user, cls.level.slug);

  const record = await prisma.classYearRecord.upsert({
    where: { classId_year: { classId: cls.id, year: data.year } },
    create: {
      classId: cls.id,
      year: data.year,
      roomId: data.roomId || null,
      catechumensCount: data.catechumensCount ?? null,
      notes: data.notes || null,
      catechists: data.catechistIds?.length
        ? { create: data.catechistIds.map((catechistId) => ({ catechistId })) }
        : undefined,
    },
    update: {
      roomId: data.roomId || null,
      catechumensCount: data.catechumensCount ?? null,
      notes: data.notes || null,
    },
  });

  if (data.catechistIds) {
    await prisma.classYearRecordCatechist.deleteMany({ where: { yearRecordId: record.id } });
    if (data.catechistIds.length) {
      await prisma.classYearRecordCatechist.createMany({
        data: data.catechistIds.map((catechistId) => ({ yearRecordId: record.id, catechistId })),
      });
    }
  }

  await logAudit({
    user,
    action: "UPSERT_CLASS_YEAR_RECORD",
    entityType: "ClassYearRecord",
    entityId: record.id,
    metadata: { classId: cls.id, year: data.year },
  });

  return NextResponse.json(record, { status: 201 });
});
