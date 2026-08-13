"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ImportParseResult } from "@/lib/importCatechumens";
import { formatDateBR } from "@/lib/format";

type Stage = "idle" | "loading" | "preview" | "confirming" | "done" | "error";

export function ImportWizard({ classId, className }: { classId: string; className: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<ImportParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setStage("loading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selected);
      const res = await fetch(`/api/turmas/${classId}/catequizandos/importar`, {
        method: "POST",
        body: formData,
      });
      const body = (await res.json()) as ImportParseResult & { error?: string };
      if (!res.ok) throw new Error(body.error || "Não foi possível ler o arquivo.");
      setResult(body);
      setStage("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido ao ler o arquivo.");
      setStage("error");
    }
  }

  async function handleConfirm() {
    if (!file) return;
    setStage("confirming");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/turmas/${classId}/catequizandos/importar/confirmar`, {
        method: "POST",
        body: formData,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Não foi possível concluir a importação.");
      setImportedCount(body.imported);
      setStage("done");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
      setStage("preview");
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
    setImportedCount(null);
    setStage("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-parish-200 bg-white p-6">
        <h2 className="font-serif text-lg font-semibold text-parish-900">1. Selecionar arquivo</h2>
        <p className="mt-1 text-sm text-parish-600">
          Turma: <span className="font-medium">{className}</span>. O arquivo (Excel ou CSV) deve
          conter as colunas: Nome, Data de nascimento, Batismo, Primeira Eucaristia e Crisma.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="mt-4 block text-sm"
        />
      </div>

      {stage === "loading" && (
        <p className="rounded-md border border-parish-200 bg-white px-4 py-3 text-sm text-parish-600">
          Lendo arquivo...
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {result && result.columnErrors.length > 0 && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-800">Não foi possível validar o arquivo:</p>
          <ul className="mt-1 list-inside list-disc text-sm text-red-700">
            {result.columnErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {result && result.columnErrors.length === 0 && (stage === "preview" || stage === "confirming") && (
        <div className="rounded-lg border border-parish-200 bg-white p-6">
          <h2 className="font-serif text-lg font-semibold text-parish-900">2. Prévia da importação</h2>
          <p className="mt-1 text-sm text-parish-700">
            {result.rows.length} catequizando(s) encontrado(s) no arquivo — {result.validCount} válido(s)
            {result.invalidCount > 0 && `, ${result.invalidCount} com erro`}.
          </p>

          <div className="table-scroll mt-4 max-h-96 overflow-y-auto rounded-md border border-parish-200">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-parish-100 text-xs uppercase tracking-wide text-parish-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">Linha</th>
                  <th className="px-3 py-2 font-semibold">Nome</th>
                  <th className="px-3 py-2 font-semibold">Nascimento</th>
                  <th className="px-3 py-2 font-semibold">Batismo</th>
                  <th className="px-3 py-2 font-semibold">Eucaristia</th>
                  <th className="px-3 py-2 font-semibold">Crisma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parish-100">
                {result.rows.map((row) => (
                  <tr key={row.line} className={row.errors.length > 0 ? "bg-red-50" : ""}>
                    <td className="px-3 py-2 text-parish-500">{row.line}</td>
                    <td className="px-3 py-2">
                      {row.name || <span className="italic text-red-600">vazio</span>}
                      {row.errors.length > 0 && (
                        <ul className="mt-0.5 list-inside list-disc text-xs text-red-600">
                          {row.errors.map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-3 py-2">{row.birthDateIso ? formatDateBR(row.birthDateIso) : "—"}</td>
                    <td className="px-3 py-2">{row.baptized === null ? "—" : row.baptized ? "Sim" : "Não"}</td>
                    <td className="px-3 py-2">
                      {row.firstEucharist === null ? "—" : row.firstEucharist ? "Sim" : "Não"}
                    </td>
                    <td className="px-3 py-2">{row.confirmed === null ? "—" : row.confirmed ? "Sim" : "Não"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.invalidCount > 0 ? (
            <p className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Corrija os erros indicados acima no arquivo original e envie-o novamente. Nenhum dado
              será alterado enquanto houver linhas com erro.
            </p>
          ) : (
            <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-900">
                Esta importação substituirá a lista atual de catequizandos desta turma. Os registros
                atuais serão removidos desta turma e substituídos pelos dados do arquivo.
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-md border border-parish-300 bg-white px-4 py-2 text-sm font-medium text-parish-700 hover:bg-parish-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={stage === "confirming"}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {stage === "confirming" ? "Processando..." : "Confirmar substituição"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {stage === "done" && importedCount !== null && (
        <div className="rounded-md border border-green-300 bg-green-50 px-4 py-4">
          <p className="text-sm font-medium text-green-900">
            Importação concluída: {importedCount} catequizando(s) cadastrado(s) nesta turma.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-3 rounded-md border border-green-400 bg-white px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-50"
          >
            Importar outro arquivo
          </button>
        </div>
      )}
    </div>
  );
}
