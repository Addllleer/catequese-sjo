"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminEntityForm, type FieldConfig } from "./AdminEntityForm";
import { ConfirmButton } from "@/components/ConfirmButton";

export function EditableEntity({
  fields,
  initialValues,
  patchAction,
  deleteAction,
  deleteTitle,
  deleteMessage,
  children,
}: {
  fields: FieldConfig[];
  initialValues: Record<string, any>;
  patchAction: string;
  deleteAction?: string;
  deleteTitle?: string;
  deleteMessage?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="rounded-md border border-parish-300 bg-parish-50 p-4">
        <AdminEntityForm
          fields={fields}
          initialValues={initialValues}
          submitLabel="Salvar alterações"
          method="PATCH"
          action={patchAction}
          onSuccess={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  async function handleDelete() {
    const res = await fetch(deleteAction!, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Não foi possível excluir.");
    }
    router.refresh();
  }

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">{children}</div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-md border border-parish-300 px-3 py-1.5 text-sm font-medium text-parish-700 hover:bg-parish-50"
        >
          Editar
        </button>
        {deleteAction && (
          <ConfirmButton
            label="Excluir"
            title={deleteTitle ?? "Confirmar exclusão"}
            message={deleteMessage ?? "Esta ação não pode ser desfeita."}
            confirmLabel="Excluir"
            onConfirm={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
