// Delegates to a storage adapter. Set `STORAGE_ADAPTER=supabase` to use Supabase Storage.
const adapter = process.env.STORAGE_ADAPTER === 'supabase'
  ? require('./storage.supabase')
  : require('./storage.local');

export const ensureStorageDir = adapter.ensureStorageDir;
export const saveDocumentFile = adapter.saveDocumentFile;
export const readDocumentFile = adapter.readDocumentFile;
export const deleteDocumentFile = adapter.deleteDocumentFile;

export default { ensureStorageDir, saveDocumentFile, readDocumentFile, deleteDocumentFile };
