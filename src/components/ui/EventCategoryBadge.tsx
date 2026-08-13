import { EVENT_CATEGORY_COLORS, EVENT_CATEGORY_DOT, EVENT_CATEGORY_LABELS } from "@/lib/constants";
import type { EventCategory } from "@prisma/client";

export function EventCategoryBadge({ category }: { category: EventCategory }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${EVENT_CATEGORY_COLORS[category]}`}
    >
      <span aria-hidden="true">{EVENT_CATEGORY_DOT[category]}</span>
      {EVENT_CATEGORY_LABELS[category]}
    </span>
  );
}
