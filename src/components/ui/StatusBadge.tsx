import { CLASS_STATUS_DOT, CLASS_STATUS_LABELS } from "@/lib/constants";
import type { ClassStatus } from "@prisma/client";

const STYLES: Record<ClassStatus, string> = {
  ATIVA: "bg-green-50 text-green-800 border-green-300",
  PLANEJAMENTO: "bg-yellow-50 text-yellow-800 border-yellow-300",
  CONCLUIDA: "bg-red-50 text-red-800 border-red-300",
};

export function StatusBadge({ status }: { status: ClassStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      <span aria-hidden="true">{CLASS_STATUS_DOT[status]}</span>
      {CLASS_STATUS_LABELS[status]}
    </span>
  );
}
