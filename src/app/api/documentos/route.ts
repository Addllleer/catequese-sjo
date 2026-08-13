import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, canManageLevel, ApiError } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { documentMetaSchema } from "@/lib/validations";
import { DOCUMENT_CATEGORY_TO_LEVEL_SLUG } from "@/lib/constants";
import { saveDocumentFile } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

export const POST = apiHandler(async (req) => {
  const user = await requireUser();

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new ApiError(400, "Nenhum arquivo enviado.");
  }

  const metaRaw = formData.get("meta");
  if (typeof metaRaw !== "string") throw new ApiError(400, "Metadados do documento ausentes.");
  const data = documentMetaSchema.parse(JSON.parse(metaRaw));

  // A categoria determina o nível associado (quando corresponde a um).
  // Um Responsável de Nível só pode publicar em categorias do próprio
  // nível (ou "Geral"/"Formação de Catequistas", reservadas ao Administrador).
  const levelSlug = DOCUMENT_CATEGORY_TO_LEVEL_SLUG[data.category];
  if (levelSlug) {
    if (!canManageLevel(user, levelSlug)) {
      throw new ApiError(403, "Você só pode adicionar documentos do próprio nível.");
    }
  } else if (user.role !== "ADMIN") {
    throw new ApiError(403, "Documentos gerais ou de formação de catequistas são gerenciados pelo Administrador.");
  }

  const level = levelSlug ? await prisma.level.findUnique({ where: { slug: levelSlug } }) : null;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { filePath, fileName } = await saveDocumentFile(file.name, buffer);

  const document = await prisma.repositoryDocument.create({
    data: {
      name: data.name,
      description: data.description || null,
      tags: data.tags ?? [],
      category: data.category,
      type: data.type,
      year: data.year || null,
      levelId: level?.id ?? null,
      visibility: data.visibility,
      fileName,
      filePath,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: buffer.length,
      publishedAt: new Date(),
    },
  });

  await logAudit({ user, action: "UPLOAD_DOCUMENT", entityType: "RepositoryDocument", entityId: document.id });

  return NextResponse.json(document, { status: 201 });
});
