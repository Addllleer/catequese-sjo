"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmButton } from "@/components/ConfirmButton";
import { AddYearRecordForm } from "./AddYearRecordForm";

export function ClassActions({
  classId,
  publicId,
  status,
  catechumensCount,
  hasHistory,
  rooms,
  catechists,
}: {
  classId: string;
  publicId: string;
  status: "ATIVA" | "PLANEJAMENTO" | "CONCLUIDA";
  catechumensCount: number;
  hasHistory: boolean;
  rooms: Array<{ id: string; name: string }>;
  catechists: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [showHistoryForm, setShowHistoryForm] = useState(false);

  async function setStatus(newStatus: string) {
    const res = await fetch(`/api/turmas/${classId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Não foi possível alterar o status.");
    }
    router.refresh();
  }

  async function handleDelete() {
    const res = await fetch(`/api/turmas/${classId}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Não foi possível excluir a turma.");
    }
    router.push("/admin/turmas");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {status !== "CONCLUIDA" ? (
          <ConfirmButton
            label="Arquivar turma"
            variant="default"
            title="Arquivar turma"
            message={`A turma ${publicId} será marcada como "Concluída/Arquivada". Ela deixará de aparecer nas visões principais por padrão, mas continuará disponível para consulta histórica.`}
            confirmLabel="Arquivar"
            onConfirm={() => setStatus("CONCLUIDA")}
          />
        ) : (
          <ConfirmButton
            label="Reativar turma"
            variant="default"
            title="Reativar turma"
            message={`A turma ${publicId} voltará a ter status "Em planejamento" e passará a aparecer novamente nas visões principais.`}
            confirmLabel="Reativar"
            onConfirm={() => setStatus("PLANEJAMENTO")}
          />
        )}

        <button
          type="button"
          onClick={() => setShowHistoryForm((v) => !v)}
          className="rounded-md border border-parish-300 px-3 py-1.5 text-sm font-medium text-parish-700 hover:bg-parish-50"
        >
          {showHistoryForm ? "Fechar" : "+ Registrar ano no histórico"}
        </button>

        <ConfirmButton
          label="Excluir turma"
          title="Excluir turma permanentemente"
          message={`Você está prestes a excluir definitivamente a turma ${publicId}. Isso removerá também ${catechumensCount} catequizando(s) cadastrado(s) nela${
            hasHistory ? " e todo o histórico de anos registrado" : ""
          }. Esta ação não pode ser desfeita. Se deseja apenas ocultá-la das visões principais mantendo o histórico, use "Arquivar turma" em vez de excluir.`}
          confirmLabel="Excluir definitivamente"
          onConfirm={handleDelete}
        />
      </div>

      {showHistoryForm && (
        <AddYearRecordForm
          classId={classId}
          rooms={rooms}
          catechists={catechists}
          onDone={() => setShowHistoryForm(false)}
        />
      )}
    </div>
  );
}
