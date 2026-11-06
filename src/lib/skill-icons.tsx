import type { ReactNode } from "react";
import { FALLBACK_COLOR, SKILL_COLORS, skillColor } from "@/data/brand-colors";
// Named imports only — simple-icons is ESM with `sideEffects: false`, so the
// bundler keeps just these ~22 paths (verified after build).
import {
  siAngular,
  siDocker,
  siExpress,
  siGithubactions,
  siGitlab,
  siGooglecloud,
  siJavascript,
  siJest,
  siKeycloak,
  siKotlin,
  siKubernetes,
  siLangchain,
  siMysql,
  siNextdotjs,
  siNodedotjs,
  siPostgresql,
  siPostman,
  siPython,
  siReact,
  siSupabase,
  siTailwindcss,
  siTypescript,
  type SimpleIcon,
} from "simple-icons";

export interface SkillBrand {
  /** Display colour: used for the icon, glow, laser and focus highlight. */
  color: string;
  /** Lightweight <svg><use/></svg> referencing the sprite symbol. */
  icon: ReactNode;
}

/** Symbol contents (24×24 viewBox). Logos inherit `fill` (currentColor). */
type SymbolDef = ReactNode;

/**
 * Icons are rendered as an SVG sprite: <SkillIconSprite/> (once per page)
 * defines a <symbol> per skill, and every usage is a tiny <use href>.
 * The Skills UI shows each logo 3+ times (orbit, chips, detail) and the
 * props are also serialised into the RSC payload — inlining every path cut
 * the section's gzipped HTML by ~45% (32 KB → 18 KB) when moved to a sprite.
 */
const symbolId = (id: string) => `skill-icon-${id}`;

// Colours live in src/data/brand-colors.ts (single source of truth).
const logo = (icon: SimpleIcon): SymbolDef => <path d={icon.path} />;

/**
 * Brands simple-icons no longer ships (removed at the trademark owners'
 * request): a clean monogram badge in the brand colour instead of a blank
 * or broken icon.
 */
const monogram = (text: string, color: string): SymbolDef => (
  <>
    <rect x="0.5" y="0.5" width="23" height="23" rx="6" fill={color} />
    <text
      x="12"
      y="12.5"
      textAnchor="middle"
      dominantBaseline="central"
      fontFamily="var(--font-geist-sans), system-ui, sans-serif"
      fontWeight="700"
      fontSize={text.length > 2 ? 8.5 : 11}
      fill="#fff"
    >
      {text}
    </text>
  </>
);

/** Keyed by skill id (see profile.ts). */
const SYMBOLS: Record<string, SymbolDef> = {
  angular: logo(siAngular),
  typescript: logo(siTypescript),
  javascript: logo(siJavascript),
  react: logo(siReact),
  nextjs: logo(siNextdotjs),
  tailwind: logo(siTailwindcss),
  nodejs: logo(siNodedotjs),
  express: logo(siExpress),
  java: monogram("Jv", SKILL_COLORS.java.color),
  kotlin: logo(siKotlin),
  postgresql: logo(siPostgresql),
  mysql: logo(siMysql),
  mssql: monogram("SQL", SKILL_COLORS.mssql.color),
  supabase: logo(siSupabase),
  playwright: monogram("Pw", SKILL_COLORS.playwright.color),
  jest: logo(siJest),
  postman: logo(siPostman),
  docker: logo(siDocker),
  kubernetes: logo(siKubernetes),
  "github-actions": logo(siGithubactions),
  "gitlab-ci": logo(siGitlab),
  aws: monogram("AWS", SKILL_COLORS.aws.color),
  gcp: logo(siGooglecloud),
  keycloak: logo(siKeycloak),
  python: logo(siPython),
  langchain: logo(siLangchain),
};

const fallback = (name: string) =>
  monogram(
    name.replace(/[^A-Za-z]/g, "").slice(0, 2) || "?",
    FALLBACK_COLOR.color,
  );

function UseIcon({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="100%"
      height="100%"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <use href={`#${symbolId(id)}`} />
    </svg>
  );
}

export function getSkillBrand(id: string): SkillBrand {
  return { color: skillColor(id).color, icon: <UseIcon id={id} /> };
}

/**
 * Renders the sprite. Server component — place once, before any icon use.
 * Not display:none (some browsers then drop <use> rendering).
 */
export function SkillIconSprite({
  skills,
}: {
  skills: { id: string; name: string }[];
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        {skills.map((s) => (
          <symbol key={s.id} id={symbolId(s.id)} viewBox="0 0 24 24">
            {SYMBOLS[s.id] ?? fallback(s.name)}
          </symbol>
        ))}
      </defs>
    </svg>
  );
}
