"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DOCUMENT_CATEGORY_LABELS, DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import type { DocumentCategory, DocumentType, DocumentVisibility } from "@prisma/client";

export function DocumentUploadForm({
  allowedCategories,
  onDone,
}: {
  allowedCategories: DocumentCategory[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState<DocumentCategory>(allowedCategories[0]);
  const [type, setType] = useState<DocumentType>("DOCUMENTO");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [visibility, setVisibility] = useState<DocumentVisibility>("AUTENTICADO");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Selecione um arquivo.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "meta",
        JSON.stringify({
          name,
          description: description || null,
          tags: tags
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean),
          category,
          type,
          year: year ? Number(year) : null,
          visibility,
        })
      );

      const res = await fetch("/api/documentos", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Não foi possível enviar o documento.");
      }
      router.refresh();
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-parish-800">Arquivo *</label>
        <input
          type="file"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 block text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-parish-800">Nome *</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-parish-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-parish-800">Descrição</label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded-md border border-parish-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-parish-800">Categoria *</label>
        <select
          required
          value={category}
          onChange={(e) => setCategory(e.target.value as DocumentCategory)}
          className="mt-1 w-full rounded-md border border-parish-300 bg-white px-3 py-2 text-sm"
        >
          {allowedCategories.map((c) => (
            <option key={c} value={c}>
              {DOCUMENT_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-parish-800">Tipo *</label>
        <select
          required
          value={type}
          onChange={(e) => setType(e.target.value as DocumentType)}
          className="mt-1 w-full rounded-md border border-parish-300 bg-white px-3 py-2 text-sm"
        >
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-parish-800">Ano</label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="mt-1 w-full rounded-md border border-parish-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-parish-800">Visibilidade *</label>
        <select
          required
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as DocumentVisibility)}
          className="mt-1 w-full rounded-md border border-parish-300 bg-white px-3 py-2 text-sm"
        >
          <option value="PUBLICO">🌐 Público</option>
          <option value="AUTENTICADO">🔐 Usuários autenticados</option>
          <option value="ADMIN">🔴 Somente Administrador</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-parish-800">Tags (separadas por vírgula)</label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="ex.: batismo, roteiro, 2026"
          className="mt-1 w-full rounded-md border border-parish-300 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

      <div className="flex gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-parish-800 px-4 py-2 text-sm font-medium text-white hover:bg-parish-900 disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Enviar documento"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-parish-300 px-4 py-2 text-sm font-medium text-parish-700 hover:bg-parish-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
