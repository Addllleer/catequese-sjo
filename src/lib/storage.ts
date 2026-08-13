import { randomUUID } from "crypto";
import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";

/**
 * Armazenamento de documentos do Repositório.
 *
 * Os arquivos NUNCA são salvos dentro de /public: um documento com
 * visibilidade "Autenticado" ou "Somente Administrador" não pode ficar
 * acessível apenas por quem conhece a URL. Todo download passa pela rota
 * /api/documents/[id]/download, que reconfirma a permissão do usuário antes
 * de ler o arquivo do disco (ver especificação, seção 48).
 */

const STORAGE_DIR = path.join(process.cwd(), process.env.STORAGE_DIR || "storage/repository");

export async function ensureStorageDir() {
  await mkdir(STORAGE_DIR, { recursive: true });
}

export async function saveDocumentFile(
  originalName: string,
  buffer: Buffer
): Promise<{ filePath: string; fileName: string }> {
  await ensureStorageDir();
  const ext = path.extname(originalName);
  const storedName = `${randomUUID()}${ext}`;
  const fullPath = path.join(STORAGE_DIR, storedName);
  await writeFile(fullPath, buffer);
  return { filePath: storedName, fileName: originalName };
}

export async function readDocumentFile(filePath: string): Promise<Buffer> {
  const fullPath = path.join(STORAGE_DIR, filePath);
  return readFile(fullPath);
}

export async function deleteDocumentFile(filePath: string): Promise<void> {
  const fullPath = path.join(STORAGE_DIR, filePath);
  try {
    await unlink(fullPath);
  } catch {
    // Arquivo já pode não existir — não é um erro fatal para a exclusão do registro.
  }
}
