/**
 * Single source of truth for ALL personal content on the site.
 * Components must read from here and never hardcode personal details.
 *
 * Strings starting with "TODO" are placeholders still to be filled in —
 * `grep -n TODO src/data/profile.ts` lists them.
 */

export type SocialPlatform = "github" | "linkedin" | "x" | "email" | "website";

export interface SocialLink {
  platform: SocialPlatform;
  label: string;
  href: string;
}

export interface CurrentlyItem {
  /** Short verb shown as the card label, e.g. "Learning", "Building". */
  label: string;
  text: string;
  href?: string;
}

export interface Stat {
  value: number;
  /** Rendered right after the number, e.g. "+". */
  suffix?: string;
  prefix?: string;
  label: string;
}

export type CodeLang =
  | "ts"
  | "tsx"
  | "js"
  | "html"
  | "sql"
  | "java"
  | "kotlin"
  | "python"
  | "yaml"
  | "dockerfile"
  | "bash";

export interface CodeSample {
  lang: CodeLang;
  /** Shown in the editor tab, e.g. "counter.component.ts". */
  file: string;
  /** 3–6 short lines. */
  source: string;
}

export interface Skill {
  /** Stable id — also keys the brand icon/colour in src/lib/skill-icons.tsx. */
  id: string;
  name: string;
  /** One factual, modest line on how I use it. */
  desc: string;
  code: CodeSample;
  badge?: "Core";
}

export interface SkillGroup {
  id: string;
  name: string;
  /** "learning" = currently learning (outer, muted ring + Learning badge). */
  status?: "learning";
  skills: Skill[];
}

export interface ExperienceItem {
  company: string;
  role: string;
  location?: string;
  /** "YYYY" or "YYYY-MM" */
  start: string;
  /** "YYYY", "YYYY-MM" or "present" */
  end: string | "present";
  summary?: string;
  highlights: string[];
  tech: string[];
  url?: string;
}

export type ProjectType = "professional" | "personal";

export interface ProjectLinks {
  live?: string;
  repo?: string;
  caseStudy?: string;
}

export interface Project {
  /** Stable id (used for keys / anchors). */
  slug: string;
  name: string;
  /** Short descriptor shown after the name, e.g. "Business Messaging Platform". */
  tagline?: string;
  type: ProjectType;
  /** Optional qualifier for the type badge, e.g. "Freelance". */
  typeNote?: string;
  /** My role — mainly for professional projects. */
  role?: string;
  /** Company the work was done at (professional projects). */
  company?: string;
  summary: string;
  highlights: string[];
  stack: string[];
  /**
   * Public links. Professional (client/NDA) work usually has none — UI must
   * render gracefully when this is missing or empty.
   */
  links?: ProjectLinks;
  /**
   * Screenshot under /public, e.g. "/projects/kero.webp". Empty/undefined →
   * a generated cover is shown, so adding one later is a data-only change.
   */
  image?: string;
  /** Large tile in the Projects bento. */
  featured: boolean;
  /** Recognition shown as a badge, e.g. "Spot Award". */
  award?: string;
}

export interface Profile {
  name: string;
  title: string;
  /** Rotating / animated role titles for the hero. */
  roles: string[];
  tagline: string;
  location: string;
  yearsOfExperience: number;
  email: string;
  /** Path under /public */
  photo: string;
  /**
   * Background-removed portrait (path under /public) for the About particle
   * effect. Falls back to `photo` if the file is missing.
   */
  photoCutout?: string;
  /** Bio paragraphs. */
  about: string[];
  /**
   * Phrases in `about` to emphasise (accent + glitch on hover). Each must
   * appear verbatim in the bio — a missing one logs a dev-time warning.
   */
  aboutHighlights: string[];
  stats: Stat[];
  currently: CurrentlyItem[];
  /** Projects section copy. */
  projectsIntro: { title: string; description: string };
  /** Skills section copy. */
  skillsIntro: { title: string; description: string };
  /** Ring order = inner → outer in the Skills orbit. */
  skills: SkillGroup[];
  experience: ExperienceItem[];
  projects: Project[];
  socials: SocialLink[];
  seo: {
    title: string;
    description: string;
    url: string;
  };
}

export const profile: Profile = {
  name: "Jayshil Darji",
  title: "Senior Software Engineer",
  roles: [
    "Senior Software Engineer",
    "Angular & TypeScript Specialist",
    "Frontend Engineer",
    "Full-stack Builder",
  ],
  tagline: "10 years of building fast, polished, scalable web applications.",
  location: "Gujarat, India",
  yearsOfExperience: 10,
  email: "jayshild033@gmail.com",
  photo: "/images/jayshil.jpg",
  photoCutout: "/images/jayshil-cutout.png",
  about: [
    "I'm a Senior Software Engineer from Gujarat, India, with 10 years of building web applications. At Cygnet.One I lead frontend development on enterprise Angular platforms, from a government notary portal to an omnichannel business messaging platform, mentoring developers and owning code quality and releases. Outside work I build full-stack products with Next.js and Supabase, and I'm now exploring GenAI engineering.",
  ],
  aboutHighlights: [
    "Cygnet.One",
    "Angular",
    "Next.js and Supabase",
    "GenAI engineering",
  ],
  stats: [
    { value: 10, suffix: "+", label: "Years experience" },
    { value: 2, label: "Company awards" },
    { value: 5, label: "Featured projects" },
  ],
  currently: [
    { label: "Learning", text: "Python, as the foundation for GenAI work" },
    {
      label: "Exploring",
      text: "RAG, LangChain and building LLM-powered apps",
    },
    {
      label: "Building",
      text: "This portfolio, with Next.js and heavy motion",
    },
  ],
  projectsIntro: {
    title: "Selected Work",
    description:
      "Enterprise platforms I've helped lead at Cygnet.One, and full-stack products I build on my own.",
  },
  skillsIntro: {
    title: "My Tech Universe",
    description:
      "10 years of tools I've shipped with. Click a planet to see how I use it.",
  },
  skills: [
    {
      id: "frontend",
      name: "Frontend",
      skills: [
        {
          id: "angular",
          name: "Angular",
          badge: "Core",
          desc: "My main framework: enterprise platforms at Cygnet.One, currently on Angular 16–20.",
          code: {
            lang: "ts",
            file: "counter.component.ts",
            source: `@Component({ selector: "app-counter", template: "{{ double() }}" })
export class CounterComponent {
  count = signal(0);
  double = computed(() => this.count() * 2);
}`,
          },
        },
        {
          id: "typescript",
          name: "TypeScript",
          badge: "Core",
          desc: "My default language for frontend and Node.js work.",
          code: {
            lang: "ts",
            file: "result.ts",
            source: `type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const fail = (error: string): Result<never> => ({ ok: false, error });`,
          },
        },
        {
          id: "javascript",
          name: "JavaScript",
          desc: "The base under every framework I work with.",
          code: {
            lang: "js",
            file: "utils.js",
            source: `const ids = [...new Set(items.map((i) => i.id))];
const byType = Object.groupBy(items, (i) => i.type);`,
          },
        },
        {
          id: "react",
          name: "React",
          desc: "Used with Next.js for my personal full-stack products.",
          code: {
            lang: "tsx",
            file: "Total.tsx",
            source: `function Total({ items }: { items: Expense[] }) {
  const total = useMemo(() => sum(items), [items]);
  return <p>Total: {format(total)}</p>;
}`,
          },
        },
        {
          id: "nextjs",
          name: "Next.js",
          desc: "Framework for TripSplit, FitnessHub, OMG EV and this site.",
          code: {
            lang: "tsx",
            file: "app/trips/page.tsx",
            source: `export default async function TripsPage() {
  const trips = await getTrips();
  return <TripList trips={trips} />;
}`,
          },
        },
        {
          id: "tailwind",
          name: "Tailwind CSS",
          desc: "Styling for my Next.js projects, including this portfolio.",
          code: {
            lang: "html",
            file: "button.html",
            source: `<button class="rounded-full bg-sky-500 px-4 py-2
  font-medium text-white hover:bg-sky-400">
  Save
</button>`,
          },
        },
      ],
    },
    {
      id: "backend",
      name: "Backend",
      skills: [
        {
          id: "nodejs",
          name: "Node.js",
          desc: "Runtime for APIs, scripts and build tooling.",
          code: {
            lang: "ts",
            file: "load-config.ts",
            source: `import { readFile } from "node:fs/promises";

const raw = await readFile("config.json", "utf8");
export const config = JSON.parse(raw);`,
          },
        },
        {
          id: "express",
          name: "Express.js",
          desc: "Lightweight REST APIs and middleware on Node.js.",
          code: {
            lang: "ts",
            file: "routes/members.ts",
            source: `app.get("/api/members/:id", async (req, res) => {
  const member = await members.findById(req.params.id);
  if (!member) return res.status(404).end();
  res.json(member);
});`,
          },
        },
        {
          id: "java",
          name: "Java",
          desc: "Worked alongside Java backend services on the Nobilex platform.",
          code: {
            lang: "java",
            file: "Titles.java",
            source: `public record Document(String id, String title) {}

List<String> titles = documents.stream()
    .map(Document::title)
    .toList();`,
          },
        },
        {
          id: "kotlin",
          name: "Kotlin",
          desc: "Worked alongside Kotlin services on the Nobilex platform.",
          code: {
            lang: "kotlin",
            file: "Templates.kt",
            source: `data class Template(val id: String, val name: String)

val names = templates
    .filter { it.name.isNotBlank() }
    .map { it.name }`,
          },
        },
      ],
    },
    {
      id: "data",
      name: "Data",
      skills: [
        {
          id: "postgresql",
          name: "PostgreSQL",
          desc: "The database behind my Supabase projects.",
          code: {
            lang: "sql",
            file: "balances.sql",
            source: `SELECT payer_id, SUM(amount) AS paid
FROM expenses
WHERE trip_id = $1
GROUP BY payer_id;`,
          },
        },
        {
          id: "mysql",
          name: "MySQL",
          desc: "Relational database for web application backends.",
          code: {
            lang: "sql",
            file: "indexes.sql",
            source: `CREATE INDEX idx_orders_user
  ON orders (user_id, created_at);`,
          },
        },
        {
          id: "mssql",
          name: "MSSQL",
          desc: "SQL Server queries in enterprise projects.",
          code: {
            lang: "sql",
            file: "recent.sql",
            source: `SELECT TOP (10) Name, CreatedAt
FROM dbo.Documents
ORDER BY CreatedAt DESC;`,
          },
        },
        {
          id: "supabase",
          name: "Supabase",
          desc: "Auth, Postgres and storage for TripSplit and FitnessHub.",
          code: {
            lang: "ts",
            file: "expenses.ts",
            source: `const { data, error } = await supabase
  .from("expenses")
  .select("id, amount, payer:members(name)")
  .eq("trip_id", tripId);`,
          },
        },
      ],
    },
    {
      id: "testing",
      name: "Testing",
      skills: [
        {
          id: "playwright",
          name: "Playwright",
          desc: "End-to-end tests for critical user flows.",
          code: {
            lang: "ts",
            file: "login.spec.ts",
            source: `test("user can sign in", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("me@example.com");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/dashboard");
});`,
          },
        },
        {
          id: "jest",
          name: "Jest",
          desc: "Unit tests for TypeScript logic.",
          code: {
            lang: "ts",
            file: "split.test.ts",
            source: `test("equal split keeps the exact total", () => {
  const parts = splitEqual(100, 3);
  expect(parts.reduce((a, b) => a + b, 0)).toBe(100);
});`,
          },
        },
        {
          id: "postman",
          name: "Postman",
          desc: "Exploring, documenting and testing REST APIs.",
          code: {
            lang: "js",
            file: "tests.js",
            source: `pm.test("returns the created member", () => {
  pm.response.to.have.status(201);
  pm.expect(pm.response.json()).to.have.property("id");
});`,
          },
        },
      ],
    },
    {
      id: "devops",
      name: "DevOps & Cloud",
      skills: [
        {
          id: "docker",
          name: "Docker",
          desc: "Containerising apps for consistent local and CI environments.",
          code: {
            lang: "dockerfile",
            file: "Dockerfile",
            source: `FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "start"]`,
          },
        },
        {
          id: "kubernetes",
          name: "Kubernetes",
          desc: "Deployment platform for the Nobilex project.",
          code: {
            lang: "yaml",
            file: "deployment.yaml",
            source: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2`,
          },
        },
        {
          id: "github-actions",
          name: "GitHub Actions",
          desc: "CI for lint, tests and builds.",
          code: {
            lang: "yaml",
            file: ".github/workflows/ci.yml",
            source: `on: [push]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4`,
          },
        },
        {
          id: "gitlab-ci",
          name: "GitLab CI/CD",
          desc: "Build and release pipelines in client projects.",
          code: {
            lang: "yaml",
            file: ".gitlab-ci.yml",
            source: `build:
  stage: build
  image: node:22
  script:
    - npm ci
    - npm run build`,
          },
        },
        {
          id: "aws",
          name: "AWS",
          desc: "Cognito auth and S3 media storage on the Kero platform.",
          code: {
            lang: "ts",
            file: "upload.ts",
            source: `await s3.send(new PutObjectCommand({
  Bucket: process.env.MEDIA_BUCKET,
  Key: \`media/\${file.name}\`,
  Body: file.buffer,
}));`,
          },
        },
        {
          id: "gcp",
          name: "GCP",
          desc: "Cloud platform hosting the Nobilex project.",
          code: {
            lang: "bash",
            file: "deploy.sh",
            source: `gcloud container clusters get-credentials app-cluster \\
  --region us-central1
kubectl rollout status deployment/web`,
          },
        },
        {
          id: "keycloak",
          name: "Keycloak",
          desc: "Authentication with role-based access control on Nobilex.",
          code: {
            lang: "ts",
            file: "auth.ts",
            source: `const keycloak = new Keycloak({ url, realm: "app", clientId: "web" });
await keycloak.init({ onLoad: "login-required" });
const isAdmin = keycloak.hasRealmRole("admin");`,
          },
        },
      ],
    },
    {
      id: "learning",
      name: "Learning",
      status: "learning",
      skills: [
        {
          id: "python",
          name: "Python",
          desc: "Learning it now as the foundation for GenAI work.",
          code: {
            lang: "python",
            file: "chunk.py",
            source: `def chunk(text: str, size: int = 500) -> list[str]:
    return [text[i:i + size] for i in range(0, len(text), size)]`,
          },
        },
        {
          id: "langchain",
          name: "LangChain",
          desc: "Exploring it for RAG and LLM-powered apps.",
          code: {
            lang: "python",
            file: "split.py",
            source: `from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
chunks = splitter.split_text(document)`,
          },
        },
      ],
    },
  ],
  experience: [
    {
      company: "Cygnet.One",
      role: "Senior Software Engineer",
      start: "2020",
      end: "present",
      highlights: [
        "Spot Award for remarkable contribution to the Kero messaging platform",
        "Accolades for delivery on the Nobilex government notary portal",
        "Lead frontend development, mentor junior developers, own code reviews and the release process",
      ],
      tech: [],
    },
    {
      company: "Brainvire",
      role: "Software Engineer",
      start: "2016",
      end: "2020",
      highlights: ["TODO: achievement 1", "TODO: achievement 2"],
      tech: [],
    },
  ],
  projects: [
    {
      slug: "kero",
      award: "Spot Award",
      name: "Kero",
      tagline: "Business Messaging Platform",
      type: "professional",
      role: "Developer",
      company: "Cygnet.One",
      summary:
        "Omnichannel business messaging platform for RCS, WhatsApp Business and SMS, with campaigns, contacts, rich media and analytics.",
      highlights: [
        "Integrated REST APIs for messaging workflows, media and dynamic campaigns",
        "Built responsive features with Angular Material and modern Angular patterns",
        "Led development initiatives, code reviews and production issue resolution",
        "Received a Spot Award for this project",
      ],
      stack: [
        "Angular 20",
        "Angular Material",
        "Ruby on Rails",
        "Amazon Cognito",
        "AWS S3",
        "WordPress (Elementor)",
      ],
      featured: true,
    },
    {
      slug: "nobilex",
      award: "Client accolades",
      name: "Nobilex",
      tagline: "Government Notary Portal",
      type: "professional",
      role: "Frontend Lead",
      company: "Cygnet.One",
      summary:
        "Secure, government-authorised notary processing system with management and client portals for users, document templates, email configuration and sensitive notary data.",
      highlights: [
        "Implemented Keycloak authentication with role-based access control",
        "Led frontend development and mentored junior developers",
        "Owned code reviews, releases and deployments",
        "Worked directly with the client and guided the BA team on module design",
        "Received accolades for this project",
      ],
      stack: [
        "Angular 16",
        "Keycloak",
        "Java",
        "Kotlin",
        "Kubernetes",
        "GCP",
        "FitNesse",
      ],
      featured: true,
    },
    {
      slug: "tripsplit",
      name: "TripSplit",
      type: "personal",
      summary:
        "Mobile-first PWA for tracking group trip expenses that settles everyone up with the fewest possible payments.",
      highlights: [
        "Equal, custom, percentage and share-based splits that always sum to the exact total",
        "Greedy debt-simplification algorithm for near-minimal settlements",
        "Placeholder members whose expenses merge automatically when they sign up with a matching phone or email",
      ],
      stack: [
        "Next.js",
        "React",
        "TypeScript",
        "Supabase",
        "PostgreSQL",
        "Tailwind CSS",
      ],
      // TODO: add links: { live: "…", repo: "…" }
      featured: false,
    },
    {
      slug: "fitnesshub",
      name: "FitnessHub",
      type: "personal",
      summary:
        "Full-stack gym management platform with Owner, Trainer and Member portals and automated WhatsApp reminders.",
      highlights: [
        "Secure auth with NextAuth.js and bcrypt",
        "RBAC with 10 configurable trainer permissions",
        "REST APIs for members, payments, workouts, diets and PT sessions",
        "Cron-based membership expiry alerts via Twilio WhatsApp",
      ],
      stack: [
        "Next.js",
        "React",
        "TypeScript",
        "Supabase",
        "PostgreSQL",
        "NextAuth.js",
        "Twilio",
        "Sanity CMS",
        "Tailwind CSS",
      ],
      // TODO: add links: { live: "…", repo: "…" }
      featured: false,
    },
    {
      slug: "omg-ev",
      name: "OMG EV Vehicles",
      type: "personal",
      typeNote: "Freelance",
      summary:
        "SEO-optimised marketing and lead-generation site for an electric two-wheeler showroom in Visnagar, Gujarat.",
      highlights: [
        "Sanity CMS with custom content schemas",
        "Interactive petrol-vs-EV savings and EMI calculators",
        "Test-ride and enquiry forms connected to WhatsApp and Web3Forms",
      ],
      stack: [
        "Next.js 16",
        "React 19",
        "TypeScript",
        "Tailwind CSS 4",
        "Sanity CMS",
        "Web3Forms",
      ],
      // TODO: add links: { live: "…" }
      featured: false,
    },
  ],
  socials: [
    {
      platform: "github",
      label: "GitHub",
      href: "https://github.com/jayshil-darji",
    },
    {
      platform: "linkedin",
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/jayshil-darji-b7ba4711a",
    },
    {
      platform: "email",
      label: "Email",
      href: "mailto:jayshild033@gmail.com",
    },
  ],
  seo: {
    title: "Jayshil Darji — Senior Software Engineer",
    description:
      "Jayshil Darji — Senior Software Engineer with 10 years of building fast, polished, scalable web applications with Angular, TypeScript, React and Node.js.",
    // TODO: replace with the production Vercel URL / custom domain.
    url: "https://jayshil-portfolio.vercel.app",
  },
};
