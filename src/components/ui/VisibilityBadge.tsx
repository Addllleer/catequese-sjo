import { DOCUMENT_VISIBILITY_LABELS } from "@/lib/constants";

const STYLES: Record<string, string> = {
  PUBLICO: "bg-blue-50 text-blue-800 border-blue-300",
  AUTENTICADO: "bg-parish-100 text-parish-800 border-parish-300",
  ADMIN: "bg-red-50 text-red-800 border-red-300",
};

const ICONS: Record<string, string> = {
  PUBLICO: "🌐",
  AUTENTICADO: "🔐",
  ADMIN: "🔴",
};

export function VisibilityBadge({ visibility }: { visibility: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[visibility]}`}
    >
      <span aria-hidden="true">{ICONS[visibility]}</span>
      {DOCUMENT_VISIBILITY_LABELS[visibility]}
    </span>
  );
}
