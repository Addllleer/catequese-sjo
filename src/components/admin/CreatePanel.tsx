"use client";

import { useState } from "react";

export function CreatePanel({
  label,
  children,
}: {
  label: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-parish-800 px-4 py-2 text-sm font-medium text-white hover:bg-parish-900"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-parish-200 bg-white p-5">
      {children(() => setOpen(false))}
    </div>
  );
}
