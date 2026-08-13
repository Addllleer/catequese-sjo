import * as XLSX from "xlsx";

/**
 * Leitura e validação de arquivos de importação de catequizandos
 * (especificação, seções 23/24).
 *
 * Colunas obrigatórias no arquivo (nomes flexíveis quanto a maiúsculas e
 * espaços, mas o significado deve corresponder a):
 *   Nome | Data de nascimento | Batismo | Primeira Eucaristia | Crisma
 *
 * A importação NUNCA é aplicada por este módulo — ele apenas interpreta o
 * arquivo e devolve uma prévia com erros por linha. A substituição efetiva
 * do cadastro ocorre somente após confirmação explícita, dentro de uma
 * transação (ver rota /api/catechumens/import).
 */

export interface ParsedCatechumenRow {
  line: number; // número da linha na planilha (contando o cabeçalho como linha 1)
  name: string;
  birthDateIso: string | null;
  baptized: boolean | null;
  firstEucharist: boolean | null;
  confirmed: boolean | null;
  errors: string[];
}

export interface ImportParseResult {
  ok: boolean;
  columnErrors: string[];
  rows: ParsedCatechumenRow[];
  validCount: number;
  invalidCount: number;
}

const COLUMN_ALIASES: Record<string, string[]> = {
  name: ["nome"],
  birthDate: ["data de nascimento", "nascimento", "data nascimento"],
  baptized: ["batismo"],
  firstEucharist: ["primeira eucaristia", "eucaristia", "1ª eucaristia", "1a eucaristia"],
  confirmed: ["crisma"],
};

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function findColumn(headers: string[], field: keyof typeof COLUMN_ALIASES): string | null {
  const aliases = COLUMN_ALIASES[field].map(normalize);
  for (const h of headers) {
    if (aliases.includes(normalize(h))) return h;
  }
  return null;
}

function parseBoolean(raw: unknown): boolean | null {
  if (typeof raw === "boolean") return raw;
  const s = normalize(String(raw ?? ""));
  if (["sim", "s", "true", "1", "x"].includes(s)) return true;
  if (["nao", "não", "n", "false", "0", ""].includes(s)) return false;
  return null;
}

function parseBirthDate(raw: unknown): string | null {
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return raw.toISOString();
  }
  if (typeof raw === "number") {
    const parsed = XLSX.SSF.parse_date_code(raw);
    if (parsed) {
      const d = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
      return isNaN(d.getTime()) ? null : d.toISOString();
    }
    return null;
  }

  const s = String(raw ?? "").trim();
  if (!s) return null;

  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
    return isNaN(date.getTime()) ? null : date.toISOString();
  }

  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const [, y, mo, d] = m;
    const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
    return isNaN(date.getTime()) ? null : date.toISOString();
  }

  return null;
}

export function parseCatechumensFile(buffer: Buffer): ImportParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    return { ok: false, columnErrors: ["Não foi possível ler nenhuma planilha no arquivo enviado."], rows: [], validCount: 0, invalidCount: 0 };
  }

  const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (raw.length === 0) {
    return { ok: false, columnErrors: ["A planilha não contém nenhuma linha de dados."], rows: [], validCount: 0, invalidCount: 0 };
  }

  const headers = Object.keys(raw[0]);
  const nameCol = findColumn(headers, "name");
  const birthCol = findColumn(headers, "birthDate");
  const baptizedCol = findColumn(headers, "baptized");
  const eucharistCol = findColumn(headers, "firstEucharist");
  const confirmedCol = findColumn(headers, "confirmed");

  const columnErrors: string[] = [];
  if (!nameCol) columnErrors.push('Coluna "Nome" não encontrada.');
  if (!birthCol) columnErrors.push('Coluna "Data de nascimento" não encontrada.');
  if (!baptizedCol) columnErrors.push('Coluna "Batismo" não encontrada.');
  if (!eucharistCol) columnErrors.push('Coluna "Primeira Eucaristia" não encontrada.');
  if (!confirmedCol) columnErrors.push('Coluna "Crisma" não encontrada.');

  if (columnErrors.length > 0) {
    return { ok: false, columnErrors, rows: [], validCount: 0, invalidCount: 0 };
  }

  const rows: ParsedCatechumenRow[] = raw.map((record, idx) => {
    const line = idx + 2; // linha 1 é o cabeçalho
    const errors: string[] = [];

    const name = String(record[nameCol!] ?? "").trim();
    if (!name) errors.push(`Nome vazio na linha ${line}.`);

    const birthDateIso = parseBirthDate(record[birthCol!]);
    if (!birthDateIso) errors.push(`Data de nascimento inválida na linha ${line}.`);

    const baptized = parseBoolean(record[baptizedCol!]);
    if (baptized === null) errors.push(`Valor de "Batismo" inválido na linha ${line} (use Sim/Não).`);

    const firstEucharist = parseBoolean(record[eucharistCol!]);
    if (firstEucharist === null)
      errors.push(`Valor de "Primeira Eucaristia" inválido na linha ${line} (use Sim/Não).`);

    const confirmed = parseBoolean(record[confirmedCol!]);
    if (confirmed === null) errors.push(`Valor de "Crisma" inválido na linha ${line} (use Sim/Não).`);

    return { line, name, birthDateIso, baptized, firstEucharist, confirmed, errors };
  });

  const validCount = rows.filter((r) => r.errors.length === 0).length;
  const invalidCount = rows.length - validCount;

  return { ok: true, columnErrors: [], rows, validCount, invalidCount };
}
