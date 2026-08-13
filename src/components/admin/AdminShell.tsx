"use client";

import { useState } from "react";
import Link from "next/link";
import type { Session } from "next-auth";
import { AdminNav } from "./AdminNav";

export function AdminShell({ user, children }: { user: Session["user"]; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-parish-50">
      {/* Cabeçalho mobile */}
      <div className="flex items-center justify-between border-b border-parish-200 bg-white px-4 py-3 md:hidden">
        <Link href="/admin" className="font-serif text-base font-semibold text-parish-900">
          Catequese Paroquial
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-controls="admin-sidebar"
          className="rounded-md border border-parish-300 px-3 py-1.5 text-sm font-medium text-parish-700"
        >
          {mobileOpen ? "Fechar" : "Menu"}
        </button>
      </div>

      <div className="mx-auto flex max-w-[1400px]">
        <aside
          id="admin-sidebar"
          className={`w-64 shrink-0 border-r border-parish-200 bg-white md:sticky md:top-0 md:block md:h-screen ${
            mobileOpen ? "block" : "hidden"
          }`}
        >
          <AdminNav user={user} />
        </aside>

        <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
