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

/** Icon shown on a milestone's award chip. */
export type MilestoneIcon = "trophy" | "medal";

/** A notable piece of work within a role. No dates — order is enough. */
export interface Milestone {
  title: string;
  /** Small muted tech line under the title, e.g. "Angular 9 · Ionic 4". */
  tech?: string;
  text: string;
  /** Award / recognition, shown as a small chip. */
  badge?: string;
  icon?: MilestoneIcon;
}

export interface ExperienceRole {
  kind: "role";
  company: string;
  role: string;
  /** "YYYY" */
  start: string;
  /** "YYYY" or "present" */
  end: string;
  /** Display override for the dates, e.g. "Jan – Jun 2016" (else start – end). */
  period?: string;
  location?: string;
  summary?: string;
  milestones: Milestone[];
}

/** The open-ended "what I'm doing now" entry at the end of the timeline. */
export interface ExperienceNow {
  kind: "now";
  title: string;
  text: string;
}

export type ExperienceEntry = ExperienceRole | ExperienceNow;

export type ProjectType = "professional" | "personal";

/**
 * live: shipped and public ("Live" chip). in-development: work in progress
 * ("In development" chip). client: professional client work (the
 * "Professional" label).
 */
export type ProjectStatus = "live" | "in-development" | "client";

/** Public links. Only set ones are rendered (never empty / broken links). */
export interface ProjectLinks {
  live?: string;
  /** Button label for `live` (default "Open live app"); a ↗ is appended. */
  liveLabel?: string;
  github?: string;
}

export interface Project {
  /** Stable id (used for keys / anchors). */
  slug: string;
  name: string;
  /** Short descriptor shown after the name, e.g. "Business Messaging Platform". */
  tagline?: string;
  /** Small muted line under the name/tagline, e.g. "Client project at Cygnet.One". */
  byline?: string;
  type: ProjectType;
  /** Optional qualifier for the type badge, e.g. "Freelance". */
  typeNote?: string;
  /** My role — mainly for professional projects. */
  role?: string;
  /** Company the work was done at (professional projects). */
  company?: string;
  status: ProjectStatus;
  /** "private" → a muted "Private repo" note instead of a GitHub link. */
  repo: "public" | "private";
  summary: string;
  highlights: string[];
  stack: string[];
  /**
   * Public links. Client / private work usually has none — UI must render
   * gracefully when this is missing or empty.
   */
  links?: ProjectLinks;
  /** A short line in the expanded tile, e.g. "Demo available on request." */
  note?: string;
  /** Optional small link after the note (in-page anchors allowed). */
  noteLink?: { label: string; href: string };
  /**
   * Cover image under /public: "/images/projects/{slug}.jpg", 1600×1000
   * (16:10, shown uncropped). Replacing a file under the same name: clear
   * `.next/cache/images` locally (the optimiser caches by URL).
   */
  image: string;
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
  /** Contact section copy. */
  contact: {
    /** Marquee phrase (repeated in a decorative band; read once by SRs). */
    marquee: string;
    /** Left-column heading + sub-line. */
    heading: string;
    subline: string;
  };
  /** Local time shown in Contact (always this zone, whatever the visitor's). */
  timeZone: { iana: string; abbreviation: string; utcOffset: string };
  /** Skills section copy. */
  skillsIntro: { title: string; description: string };
  /** Ring order = inner → outer in the Skills orbit. */
  skills: SkillGroup[];
  /** Timeline, oldest → newest. */
  experience: ExperienceEntry[];
  projects: Project[];
  socials: SocialLink[];
  /**
   * Site metadata (layout.tsx, manifest, JSON-LD). The site URL is not here:
   * it comes from NEXT_PUBLIC_SITE_URL (src/lib/site-url.ts).
   */
  seo: {
    /** Default <title>; sub-pages use `titleTemplate` ("%s" = page title). */
    title: string;
    titleTemplate: string;
    /** Meta / Open Graph description (≤160 characters). */
    description: string;
    siteName: string;
    /** Installed-app name (manifest short_name). */
    shortName: string;
    /** Open Graph locale, e.g. "en_IN". */
    locale: string;
    firstName: string;
    lastName: string;
    /** JSON-LD Person address. */
    address: { region: string; country: string };
  };
}

export const profile: Profile = {
  name: "Jayshil Darji",
  title: "Senior Software Engineer",
  roles: [
    "Senior Software Engineer",
    "Full-stack Developer",
    "Frontend Lead",
    "Web Platform Engineer",
  ],
  tagline:
    "I build enterprise web platforms end to end, from business messaging to notary office automation.",
  location: "India",
  yearsOfExperience: 10,
  email: "jayshild033@gmail.com",
  photo: "/images/jayshil.jpg",
  photoCutout: "/images/jayshil-cutout.png",
  about: [
    "I'm a Senior Software Engineer from Gujarat, India, with 10 years of building web products. At Cygnet.One I lead frontend development on enterprise platforms, from business messaging to notary office automation, mentoring developers and owning code quality and releases. Outside work I build full-stack products with Next.js and Supabase, and I'm now exploring GenAI engineering.",
  ],
  aboutHighlights: [
    "Cygnet.One",
    "enterprise platforms",
    "full-stack products",
    "GenAI engineering",
  ],
  stats: [
    { value: 10, suffix: "+", label: "Years building software" },
    { value: 10, suffix: "+", label: "Enterprise modules delivered" },
    { value: 8, suffix: "+", label: "Products built" },
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
  contact: {
    marquee: "Let's work together",
    heading: "Have a role or project in mind?",
    subline: "I'm happy to talk.",
  },
  timeZone: {
    iana: "Asia/Kolkata",
    abbreviation: "IST",
    utcOffset: "UTC+5:30",
  },
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
          badge: "Core",
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
          badge: "Core",
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
      kind: "role",
      company: "RapidOps",
      role: "Intern",
      start: "2016",
      end: "2016",
      period: "Jan – Jun 2016",
      location: "Ahmedabad",
      summary:
        "Started my career learning the foundations of web development with Angular and JavaScript.",
      milestones: [],
    },
    {
      kind: "role",
      company: "Brainvire Infotech",
      role: "Software Engineer",
      start: "2016",
      end: "2020",
      location: "Ahmedabad",
      summary:
        "Built responsive web and cross-platform mobile frontends for client projects using Angular, TypeScript, Ionic and Cordova, integrating third-party REST APIs and working with cross-functional teams to deliver on schedule.",
      milestones: [
        {
          title: "FX Connect: community mobile and web app",
          tech: "Angular 9 · Ionic 4",
          text: "Built the cross-platform app for a worldwide community, with event creation, social feeds and paid resources.",
        },
        {
          title: "PetBox: pet-care services portal",
          tech: "Angular · Ant Design",
          text: "Built the web portal connecting pet owners with local pet sitters, including profiles and service-booking workflows.",
        },
        {
          title: "Arete RAP: project risk assessment tool",
          tech: "jQuery · Node.js · MongoDB",
          text: "Built the frontend for quantitative and qualitative risk scoring and schedule-impact analysis.",
        },
      ],
    },
    {
      kind: "role",
      company: "Cygnet.One",
      role: "Senior Software Engineer",
      start: "2020",
      end: "present",
      summary:
        "Lead frontend development on enterprise Angular platforms, mentor developers, and own code reviews and releases.",
      milestones: [
        {
          title: "Nobilex: Notary Office Automation Platform",
          text: "Frontend lead on 4 large modules in a 16-person team; managed production releases on Kubernetes (GCP)",
          badge: "Client accolades",
          icon: "medal",
        },
        {
          title: "Kero: Business Messaging Platform",
          text: "Built 6+ modules of the Angular 20 app in a 6-person team",
          badge: "Spot Award",
          icon: "trophy",
        },
      ],
    },
    {
      kind: "now",
      title: "Exploring GenAI engineering",
      text: "Learning Python, RAG and LangChain to build LLM-powered apps.",
    },
  ],
  projects: [
    {
      slug: "kero",
      image: "/images/projects/kero.jpg",
      award: "Spot Award",
      name: "Kero",
      tagline: "Business Messaging Platform",
      byline: "Client project at Cygnet.One",
      type: "professional",
      status: "client",
      repo: "private",
      role: "Developer",
      company: "Cygnet.One",
      summary:
        "A business messaging platform that brings RCS, WhatsApp and SMS together in one dashboard, used by companies in the UK and South Africa for campaigns and customer communication.",
      highlights: [
        "Built 6+ feature modules of the Angular 20 web app in a 6-person team",
        "Integrated REST APIs for messaging workflows, rich media and campaign management",
        "Built responsive features with Angular Material and modern Angular patterns",
        "Investigated and fixed production issues, and did code reviews",
      ],
      links: { live: "https://kero.chat", liveLabel: "Product site" },
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
      image: "/images/projects/nobilex.jpg",
      award: "Client accolades",
      name: "Nobilex",
      tagline: "Notary Office Automation Platform",
      byline: "Client project at Cygnet.One",
      type: "professional",
      status: "client",
      repo: "private",
      role: "Frontend Lead",
      company: "Cygnet.One",
      summary:
        "A cloud-native office-automation and case-management platform for Dutch notary firms, with management and client portals, document templates and secure handling of sensitive notarial data.",
      highlights: [
        "Delivered 4 large modules as frontend lead in a 16-person team",
        "Implemented Keycloak authentication with role-based access control",
        "Managed production releases on Kubernetes (GCP)",
        "Mentored junior developers and guided the BA team on module design",
        "Worked directly with the client to clarify requirements and resolve issues",
      ],
      links: { live: "https://nobilex.nl", liveLabel: "Product site" },
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
      image: "/images/projects/tripsplit.jpg",
      name: "TripSplit",
      type: "personal",
      status: "live",
      repo: "private",
      summary:
        "A mobile-first PWA for tracking group trip expenses. Friends log shared costs as they travel, and when the trip ends everyone settles up with one clean number.",
      highlights: [
        "Equal, custom, percentage and share-based splits that always add up to the exact total",
        "Greedy debt-simplification reduces group balances to the fewest possible payments",
        "Add friends who haven't signed up; their history merges automatically when they join with the same phone or email",
        "Installable PWA with passwordless email-code and Google sign-in",
      ],
      stack: [
        "Next.js",
        "React",
        "TypeScript",
        "Supabase",
        "PostgreSQL",
        "Tailwind CSS",
      ],
      links: { live: "https://www.tripssplit.app" },
      featured: false,
    },
    {
      slug: "fitnesshub",
      image: "/images/projects/fitnesshub.jpg",
      name: "FitnessHub",
      type: "personal",
      status: "in-development",
      repo: "private",
      summary:
        "A full-stack gym management platform with separate portals for owners, trainers and members, covering memberships, payments, workout and diet plans, PT sessions and automated WhatsApp reminders.",
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
      note: "Currently in development with a client. Demo available on request.",
      noteLink: { label: "Request a demo", href: "#contact" },
      featured: false,
    },
    {
      slug: "omg-ev",
      image: "/images/projects/omg-ev.jpg",
      name: "OMG EV Vehicles",
      type: "personal",
      typeNote: "Freelance",
      status: "in-development",
      repo: "private",
      summary:
        "A marketing and lead-generation website for an electric two-wheeler showroom in Visnagar, Gujarat.",
      highlights: [
        "Sanity CMS with custom content schemas",
        "Interactive petrol-vs-EV savings and EMI calculators",
        "Test-ride and enquiry forms connected to WhatsApp and Web3Forms",
        "Model comparison for up to 3 scooters side by side",
      ],
      stack: [
        "Next.js 16",
        "React 19",
        "TypeScript",
        "Tailwind CSS 4",
        "Sanity CMS",
        "Web3Forms",
      ],
      note: "Currently in development with a client. Demo available on request.",
      noteLink: { label: "Request a demo", href: "#contact" },
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
    title: "Jayshil Darji, Senior Software Engineer",
    titleTemplate: "%s · Jayshil Darji",
    description:
      "Jayshil Darji, Senior Software Engineer with 10 years of building enterprise web platforms end to end, from business messaging to notary office automation.",
    siteName: "Jayshil Darji",
    shortName: "Jayshil",
    locale: "en_IN",
    firstName: "Jayshil",
    lastName: "Darji",
    address: { region: "Gujarat", country: "IN" },
  },
};
