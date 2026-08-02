/**
 * Minimal YAML frontmatter parser for Workforce role packs.
 * Intentionally tiny (no js-yaml / gray-matter) to keep the install surface clean.
 *
 * Supports the subset we ship: scalars, quoted strings, and string arrays (`- item`).
 */

export type FrontmatterData = Record<string, unknown>;

export interface ParsedFrontmatter {
  data: FrontmatterData;
  content: string;
}

function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function coerce(value: string): string | number | boolean {
  const v = unquote(value.trim());
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

/** Split on LF; drop CR so Windows CRLF packs parse cleanly. */
function linesOf(block: string): string[] {
  return block.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

export function parseFrontmatter(raw: string): ParsedFrontmatter {
  const text = raw.replace(/^\uFEFF/, "");
  if (!text.startsWith("---")) {
    return { data: {}, content: text };
  }

  // Prefer CRLF-aware close marker, then LF-only.
  let end = text.indexOf("\r\n---", 3);
  let closeLen = 5; // \r\n---
  if (end === -1) {
    end = text.indexOf("\n---", 3);
    closeLen = 4; // \n---
  }
  if (end === -1) {
    return { data: {}, content: text };
  }

  const yamlBlock = text.slice(3, end).replace(/^\r?\n/, "");
  const bodyStart = end + closeLen;
  const content = text.slice(bodyStart).replace(/^\r?\n/, "");

  const data: FrontmatterData = {};
  const lines = linesOf(yamlBlock);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trimStart().startsWith("#")) {
      i++;
      continue;
    }

    const kv = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!kv) {
      i++;
      continue;
    }

    const key = kv[1];
    const rest = kv[2].trim();

    if (rest === "" || rest === "|" || rest === ">") {
      const items: string[] = [];
      i++;
      while (i < lines.length) {
        const row = lines[i];
        if (!row.trim()) {
          i++;
          break;
        }
        const bullet = /^\s*-\s+(.*)$/.exec(row);
        if (!bullet) break;
        items.push(unquote(bullet[1].trim()));
        i++;
      }
      data[key] = items;
      continue;
    }

    if (rest.startsWith("[") && rest.endsWith("]")) {
      const inner = rest.slice(1, -1).trim();
      data[key] = inner
        ? inner.split(",").map((part) => unquote(part.trim()))
        : [];
      i++;
      continue;
    }

    data[key] = coerce(rest);
    i++;
  }

  return { data, content };
}
