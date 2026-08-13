import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireLevelAccess, ApiError } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { parseCatechumensFile } from "@/lib/importCatechumens";

/**
 * Passo de prévia da importação (especificação, seções 23/24): lê e valida
 * o arquivo, mas NUNCA grava nada no banco. A gravação só ocorre em
 * /importar/confirmar, após confirmação explícita do usuário.
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

  return NextResponse.json(result);
});
