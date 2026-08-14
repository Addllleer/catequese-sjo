import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || 'repository';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  // In runtime this file may be imported only when configured; throw early to help debugging.
  throw new Error('Supabase storage requested but SUPABASE_URL or SUPABASE_SERVICE_KEY is not set.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
  global: { headers: { 'x-upsert': 'true' } },
});

export async function ensureStorageDir() {
  // No-op for Supabase
}

export async function saveDocumentFile(originalName: string, buffer: Buffer): Promise<{ filePath: string; fileName: string }> {
  const ext = originalName.includes('.') ? originalName.substring(originalName.lastIndexOf('.')) : '';
  const storedName = `${randomUUID()}${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(storedName, buffer, {
    contentType: 'application/octet-stream',
    upsert: false,
  });

  if (error) throw error;

  return { filePath: storedName, fileName: originalName };
}

export async function readDocumentFile(filePath: string): Promise<Buffer> {
  const { data, error } = await supabase.storage.from(BUCKET).download(filePath);
  if (error) throw error;
  if (!data) throw new Error('No data returned from Supabase storage');
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function deleteDocumentFile(filePath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
  if (error) throw error;
}

export default { ensureStorageDir, saveDocumentFile, readDocumentFile, deleteDocumentFile };
