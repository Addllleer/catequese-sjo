import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/permissions";
import { readDocumentFile } from "@/lib/storage";
import { visibleDocumentVisibilities } from "@/lib/documents";

/**
 * Download de documento — reconfirma a permissão no servidor mesmo que o
 * link já esteja visível na interface (especificação, seção 48): um
 * documento "Autenticado" ou "Somente Administrador" nunca deve ficar
 * acessível apenas por quem conhece a URL.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const doc = await prisma.repositoryDocument.findUnique({ where: { id: params.id } });
  if (!doc) {
    return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  }

  const session = await getSession();
  const allowed = visibleDocumentVisibilities(session?.user ?? null);
  if (!allowed.includes(doc.visibility)) {
    return NextResponse.json(
      { error: "Você não tem permissão para acessar este documento." },
      { status: 403 }
    );
  }

  const buffer = await readDocumentFile(doc.filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": doc.mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.fileName)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
