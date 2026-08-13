import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireLevelAccess, ApiError } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { parseCatechumensFile } from "@/lib/importCatechumens";
import { logAudit } from "@/lib/audit";

/**
 * Confirmação da importação (especificação, seção 23): SUBSTITUI a lista
 * atual de catequizandos da turma. O arquivo é reenviado e revalidado aqui
 * — nunca confiamos em uma prévia processada anteriormente pelo cliente.
 * Se houver qualquer erro de validação, a operação inteira é rejeitada e
 * nada é alterado (nunca substituição parcial).
 */
export const POST = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const user = await requireUser();

  const cls = await prisma.class.findUnique({ where: { id: params.id }, include: { level: true } });
  if (!cls) throw new ApiError(404, "Turma não encontrada.");
  requireLevelAccess(user, cls.level.slug);

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new ApiError(400, "Nenhum arquivo enviado.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = parseCatechumensFile(buffer);

  if (!result.ok || result.invalidCount > 0 || result.rows.length === 0) {
    throw new ApiError(
      422,
      "O arquivo contém erros de validação. Corrija-os e envie novamente — nenhum dado foi alterado."
    );
  }

  const previousCount = await prisma.catechumen.count({ where: { classId: cls.id } });

  await prisma.$transaction(async (tx) => {
    await tx.catechumen.deleteMany({ where: { classId: cls.id } });
    await tx.catechumen.createMany({
      data: result.rows.map((row) => ({
        classId: cls.id,
        name: row.name,
        birthDate: new Date(row.birthDateIso!),
        baptized: row.baptized!,
        firstEucharist: row.firstEucharist!,
        confirmed: row.confirmed!,
      })),
    });
  });

  await logAudit({
    user,
    action: "IMPORT_CATECHUMENS_REPLACE",
    entityType: "Class",
    entityId: cls.id,
    metadata: { previousCount, importedCount: result.rows.length, fileName: file.name },
  });

  return NextResponse.json({ imported: result.rows.length, previousCount });
});
