"use client";

import { useEffect, useRef, useState } from "react";
import type { CodeLang, CodeSample } from "@/data/profile";
import { cn } from "@/lib/utils";

/**
 * Editor-style code block with a tiny regex highlighter (no Shiki/Prism —
 * these snippets are 3–6 lines). Pure function of its input, so server and
 * client render identical markup.
 *
 * Long lines scroll horizontally inside the <pre> (the card never widens).
 * While code is hidden past the right edge, that edge fades out
 * (`data-more`, measured after mount → SSR has no fade, no mismatch).
 */

type Token = { t: string; c?: string };

const C_LIKE = new Set(
  "const let var function return async await export default import from type interface class new if else for of in public private record extends implements val data fun throw true false null undefined void as".split(
    " ",
  ),
);
const PY = new Set(
  "def return from import for in range as with class if else elif True False None lambda".split(
    " ",
  ),
);
const SQL = new Set(
  "SELECT FROM WHERE GROUP BY ORDER DESC ASC CREATE INDEX ON TOP AS SUM COUNT AND OR JOIN LEFT INSERT INTO VALUES UPDATE SET".split(
    " ",
  ),
);
const DOCKER = new Set(
  "FROM WORKDIR COPY RUN CMD ENV EXPOSE ARG ENTRYPOINT".split(" "),
);

const CLS = {
  keyword: "text-violet-300",
  string: "text-emerald-300",
  comment: "text-neutral-500 italic",
  number: "text-amber-300",
  fn: "text-sky-300",
  type: "text-cyan-200",
  key: "text-sky-300",
  tag: "text-rose-300",
  attr: "text-amber-200",
  deco: "text-pink-300",
  flag: "text-amber-200",
};

function rules(lang: CodeLang): RegExp {
  const str = String.raw`"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\x60(?:\\.|[^\x60\\])*\x60`;
  const hashComment = ["python", "yaml", "bash", "dockerfile"].includes(lang);
  const comment = lang === "sql" ? "--.*" : hashComment ? "#.*" : "//.*";
  const parts = [
    `(?<comment>${comment})`,
    `(?<string>${str})`,
    lang === "html" ? String.raw`(?<tag></?[A-Za-z][\w-]*|/?>)` : null,
    lang === "html" ? String.raw`(?<attr>\b[a-z-]+(?==))` : null,
    lang === "yaml" ? String.raw`(?<key>^\s*-?\s*[\w./-]+(?=:))` : null,
    lang === "bash" ? String.raw`(?<flag>(?<=\s)--?[\w-]+)` : null,
    String.raw`(?<deco>@\w+)`,
    String.raw`(?<number>\b\d+(?:\.\d+)?\b)`,
    String.raw`(?<word>\b[A-Za-z_]\w*\b)`,
  ].filter(Boolean);
  return new RegExp(parts.join("|"), "gm");
}

function classifyWord(
  word: string,
  lang: CodeLang,
  next: string,
): string | undefined {
  if (lang === "sql")
    return SQL.has(word.toUpperCase()) ? CLS.keyword : undefined;
  if (lang === "dockerfile") return DOCKER.has(word) ? CLS.keyword : undefined;
  if (lang === "python" && PY.has(word)) return CLS.keyword;
  if (["ts", "tsx", "js", "java", "kotlin"].includes(lang) && C_LIKE.has(word))
    return CLS.keyword;
  if (["yaml", "html", "bash"].includes(lang)) return undefined;
  if (next.startsWith("(")) return CLS.fn;
  if (/^[A-Z]/.test(word)) return CLS.type;
  return undefined;
}

function tokenize(source: string, lang: CodeLang): Token[] {
  const out: Token[] = [];
  const re = rules(lang);
  let last = 0;
  for (const m of source.matchAll(re)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ t: source.slice(last, idx) });
    const g = m.groups ?? {};
    const text = m[0];
    let c: string | undefined;
    if (g.comment) c = CLS.comment;
    else if (g.string) c = CLS.string;
    else if (g.tag) c = CLS.tag;
    else if (g.attr) c = CLS.attr;
    else if (g.key) c = CLS.key;
    else if (g.flag) c = CLS.flag;
    else if (g.deco) c = CLS.deco;
    else if (g.number) c = CLS.number;
    else if (g.word)
      c = classifyWord(text, lang, source.slice(idx + text.length));
    out.push({ t: text, c });
    last = idx + text.length;
  }
  if (last < source.length) out.push({ t: source.slice(last) });
  return out;
}

const LANG_LABEL: Record<CodeLang, string> = {
  ts: "TypeScript",
  tsx: "TSX",
  js: "JavaScript",
  html: "HTML",
  sql: "SQL",
  java: "Java",
  kotlin: "Kotlin",
  python: "Python",
  yaml: "YAML",
  dockerfile: "Dockerfile",
  bash: "Shell",
};

export function CodeBlock({
  sample,
  className,
}: {
  sample: CodeSample;
  className?: string;
}) {
  const lines = sample.source.split("\n");
  const tokens = tokenize(sample.source, sample.lang);
  const preRef = useRef<HTMLPreElement>(null);
  const [more, setMore] = useState(false);

  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;
    const update = () =>
      setMore(pre.scrollLeft + pre.clientWidth < pre.scrollWidth - 1);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(pre);
    pre.addEventListener("scroll", update, { passive: true });
    return () => {
      ro.disconnect();
      pre.removeEventListener("scroll", update);
    };
  }, [sample]);

  return (
    <figure
      className={cn(
        // min-w-0: never let the code's width size the card (grid/flex).
        // clip-rounded: the <pre> scroller is composited on iOS, which
        // otherwise escapes the rounded clip.
        "clip-rounded min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[oklch(0.13_0.005_260)] shadow-[0_10px_40px_-15px_oklch(0_0_0/0.8)]",
        className,
      )}
    >
      <figcaption className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[#ff5f57]/80" />
          <span className="size-2.5 rounded-full bg-[#febc2e]/80" />
          <span className="size-2.5 rounded-full bg-[#28c840]/80" />
        </span>
        <span className="truncate font-mono text-muted-foreground">
          {sample.file}
        </span>
        <span className="ml-auto shrink-0 text-[10px] tracking-widest text-muted-foreground/70 uppercase">
          {LANG_LABEL[sample.lang]}
        </span>
      </figcaption>
      <pre
        ref={preRef}
        data-more={more || undefined}
        className="overflow-x-auto overscroll-x-contain py-3 data-[more]:[mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)] font-mono text-[12.5px] leading-relaxed"
        tabIndex={0}
        aria-label={`${LANG_LABEL[sample.lang]} example: ${sample.file}`}
      >
        <code className="grid grid-cols-[auto_1fr]">
          <span
            aria-hidden="true"
            className="pr-4 pl-3 text-right text-neutral-600 select-none"
          >
            {lines.map((_, i) => (
              <span key={i} className="block">
                {i + 1}
              </span>
            ))}
          </span>
          <span className="pr-4 whitespace-pre text-neutral-200">
            {tokens.map((tok, i) =>
              tok.c ? (
                <span key={i} className={tok.c}>
                  {tok.t}
                </span>
              ) : (
                tok.t
              ),
            )}
          </span>
        </code>
      </pre>
    </figure>
  );
}
