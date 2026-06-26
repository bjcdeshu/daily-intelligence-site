# Daily Intelligence Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a Sites-powered daily intelligence dashboard that automatically presents public-source-style items across ongoing, today, this week, and watchlist views, with configurable tracked topics.

**Architecture:** Start from the Sites vinext starter. Keep information ingestion behind small typed source, topic, item, and dashboard modules, then render a client dashboard over a server-generated snapshot. Use seed source adapters for version 1 so the UI, API route, and data boundaries match the future live RSS/API ingestion path.

**Tech Stack:** Sites vinext starter, Next/React, TypeScript, Tailwind CSS, lucide-react, Vitest, Sites hosting.

---

## File Structure

- Copy starter: `C:\Users\David\.codex\plugins\cache\openai-bundled\sites\0.1.21\skills\sites-building\templates\vinext-starter\*` into the workspace root.
- Modify: `package.json` for project name, `test` script, `lucide-react`, and `vitest`.
- Modify: `app/layout.tsx` for Chinese document language and dashboard metadata.
- Replace: `app/page.tsx` with the server-rendered dashboard entry point.
- Create: `app/api/dashboard/route.ts` to return a fresh dashboard snapshot.
- Create: `app/lib/types.ts` for source, topic, item, and snapshot contracts.
- Create: `app/lib/dashboard.ts` for matching, classification, counts, sorting, and summary generation.
- Create: `app/lib/seed-data.ts` for public-source-style seed sources, topics, and items.
- Create: `app/lib/dashboard.test.ts` for classifier and topic matching behavior.
- Create: `app/components/dashboard-shell.tsx` for client-side topic state, filtering, and refresh.
- Create: `app/components/section-panel.tsx` for each dashboard section.
- Create: `app/components/insight-card.tsx` for scannable item rows/cards.
- Modify: `app/globals.css` for the dashboard base theme.
- Preserve: `.openai/hosting.json` with `d1: null` and `r2: null` for the first version.

## Task 1: Scaffold the Sites Project

**Files:**
- Copy: `C:\Users\David\.codex\plugins\cache\openai-bundled\sites\0.1.21\skills\sites-building\templates\vinext-starter\*`
- Modify: `package.json`
- Preserve: `docs/superpowers/specs/2026-06-27-daily-intelligence-site-design.md`
- Preserve: `docs/superpowers/plans/2026-06-27-daily-intelligence-site.md`

- [ ] **Step 1: Copy the vinext starter into the workspace**

Run:

```powershell
$template = 'C:\Users\David\.codex\plugins\cache\openai-bundled\sites\0.1.21\skills\sites-building\templates\vinext-starter'
Copy-Item -Path "$template\*" -Destination . -Recurse -Force
```

Expected:

```text
app/page.tsx exists
app/layout.tsx exists
.openai/hosting.json exists
package.json exists
```

- [ ] **Step 2: Replace `package.json`**

Write this exact file:

```json
{
  "name": "daily-intelligence-site",
  "version": "0.1.0",
  "private": true,
  "engines": {
    "node": ">=22.13.0"
  },
  "scripts": {
    "dev": "vinext dev",
    "build": "vinext build",
    "start": "vinext start",
    "lint": "eslint . --ignore-pattern dist --ignore-pattern .next",
    "test": "vitest run app/**/*.test.ts",
    "db:generate": "drizzle-kit generate"
  },
  "dependencies": {
    "drizzle-orm": "0.45.2",
    "lucide-react": "^0.468.0",
    "next": "16.2.6",
    "react": "19.2.6",
    "react-dom": "19.2.6"
  },
  "devDependencies": {
    "@cloudflare/vite-plugin": "1.37.1",
    "@tailwindcss/postcss": "4.2.1",
    "@types/node": "22.19.19",
    "@types/react": "19.2.14",
    "@types/react-dom": "19.2.3",
    "@vitejs/plugin-react": "6.0.2",
    "@vitejs/plugin-rsc": "0.5.26",
    "drizzle-kit": "0.31.10",
    "eslint": "9.39.4",
    "eslint-config-next": "16.2.6",
    "react-server-dom-webpack": "19.2.6",
    "tailwindcss": "4.2.1",
    "typescript": "5.9.3",
    "vinext": "0.0.50",
    "vite": "8.0.13",
    "vitest": "^3.2.4",
    "wrangler": "4.92.0"
  },
  "type": "module"
}
```

- [ ] **Step 3: Install dependencies**

Run:

```powershell
npm install
```

Expected:

```text
package-lock.json updated
node_modules present
```

- [ ] **Step 4: Commit scaffold**

Run:

```powershell
git add package.json package-lock.json app .openai build db drizzle examples public worker vite.config.ts tsconfig.json next.config.ts eslint.config.mjs postcss.config.mjs README.md
git commit -m "chore: scaffold daily intelligence site"
```

Expected:

```text
[master ...] chore: scaffold daily intelligence site
```

## Task 2: Build the Intelligence Data Layer

**Files:**
- Create: `app/lib/types.ts`
- Create: `app/lib/dashboard.ts`
- Create: `app/lib/seed-data.ts`
- Create: `app/lib/dashboard.test.ts`

- [ ] **Step 1: Write the failing data-layer test**

Create `app/lib/dashboard.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildDashboardSnapshot, getMatchedTopicIds } from "./dashboard";
import type { NormalizedItem, SourceConfig, Topic } from "./types";

const sources: SourceConfig[] = [
  {
    id: "openai",
    name: "OpenAI Blog",
    category: "ai-lab",
    url: "https://openai.com/news/",
    priority: 5,
  },
  {
    id: "global-wire",
    name: "Global Wire",
    category: "general-news",
    url: "https://example.com/world",
    priority: 4,
  },
];

const topics: Topic[] = [
  { id: "openai", name: "OpenAI", keywords: ["openai"], enabled: true },
  { id: "agents", name: "AI Agents", keywords: ["agent", "agents"], enabled: true },
  { id: "disabled", name: "Dormant", keywords: ["dormant"], enabled: false },
];

const now = new Date("2026-06-27T09:00:00+08:00");

const items: NormalizedItem[] = [
  {
    id: "ongoing-agent",
    title: "AI agent browser rollout expands",
    summary: "A new agent browser update is moving through a staged rollout.",
    sourceId: "openai",
    sourceUrl: "https://openai.com/news/agent-browser",
    publishedAt: "2026-06-27T07:00:00+08:00",
    updatedAt: "2026-06-27T08:30:00+08:00",
    tags: ["AI", "Agents"],
    topicKeywords: ["OpenAI", "AI Agents"],
    importance: 5,
    status: "ongoing",
  },
  {
    id: "today-market",
    title: "Markets react to semiconductor supply news",
    summary: "Chip supply concerns move into the day's global market conversation.",
    sourceId: "global-wire",
    sourceUrl: "https://example.com/markets/chips",
    publishedAt: "2026-06-27T06:00:00+08:00",
    updatedAt: "2026-06-27T06:30:00+08:00",
    tags: ["Markets", "Chips"],
    topicKeywords: ["chips"],
    importance: 4,
    status: "new",
  },
  {
    id: "week-policy",
    title: "AI policy talks continue this week",
    summary: "Regulators and labs continue a week of policy negotiations.",
    sourceId: "global-wire",
    sourceUrl: "https://example.com/policy/ai",
    publishedAt: "2026-06-24T10:00:00+08:00",
    updatedAt: "2026-06-25T10:00:00+08:00",
    tags: ["AI", "Policy"],
    topicKeywords: ["AI"],
    importance: 3,
    status: "updated",
  },
];

describe("daily intelligence dashboard", () => {
  it("matches enabled topics using title, summary, tags, and topic keywords", () => {
    expect(getMatchedTopicIds(items[0], topics)).toEqual(["openai", "agents"]);
  });

  it("groups items into ongoing, today, week, and watchlist sections", () => {
    const snapshot = buildDashboardSnapshot(items, sources, topics, now);

    expect(snapshot.sections.ongoing.map((item) => item.id)).toEqual(["ongoing-agent"]);
    expect(snapshot.sections.today.map((item) => item.id)).toEqual([
      "ongoing-agent",
      "today-market",
    ]);
    expect(snapshot.sections.week.map((item) => item.id)).toEqual(["week-policy"]);
    expect(snapshot.sections.watchlist.map((item) => item.id)).toEqual([
      "ongoing-agent",
      "week-policy",
    ]);
    expect(snapshot.counts).toEqual({
      ongoing: 1,
      today: 2,
      week: 1,
      watchlist: 2,
    });
    expect(snapshot.brief).toContain("1 ongoing");
    expect(snapshot.brief).toContain("2 today");
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```powershell
npm run test
```

Expected:

```text
FAIL app/lib/dashboard.test.ts
Cannot find module './dashboard'
```

- [ ] **Step 3: Create `app/lib/types.ts`**

Write this exact file:

```ts
export type SourceCategory =
  | "general-news"
  | "technology"
  | "ai-lab"
  | "research"
  | "developer";

export type ItemStatus = "new" | "updated" | "ongoing" | "archived";
export type DashboardSection = "ongoing" | "today" | "week" | "watchlist";
export type Importance = 1 | 2 | 3 | 4 | 5;

export type SourceConfig = {
  id: string;
  name: string;
  category: SourceCategory;
  url: string;
  priority: number;
};

export type Topic = {
  id: string;
  name: string;
  keywords: string[];
  enabled: boolean;
};

export type NormalizedItem = {
  id: string;
  title: string;
  summary: string;
  sourceId: string;
  sourceUrl: string;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  topicKeywords: string[];
  importance: Importance;
  status: ItemStatus;
};

export type DashboardItem = NormalizedItem & {
  source: SourceConfig;
  matchedTopicIds: string[];
};

export type DashboardSnapshot = {
  generatedAt: string;
  brief: string;
  sources: SourceConfig[];
  topics: Topic[];
  counts: Record<DashboardSection, number>;
  sections: Record<DashboardSection, DashboardItem[]>;
};
```

- [ ] **Step 4: Create `app/lib/dashboard.ts`**

Write this exact file:

```ts
import type {
  DashboardItem,
  DashboardSection,
  DashboardSnapshot,
  NormalizedItem,
  SourceConfig,
  Topic,
} from "./types";

const WATCH_TAGS = new Set([
  "ai",
  "agents",
  "models",
  "research",
  "security",
  "chips",
  "policy",
]);

const sectionOrder: DashboardSection[] = ["ongoing", "today", "week", "watchlist"];

function singaporeDayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function latestItemDate(item: NormalizedItem): Date {
  return new Date(item.updatedAt || item.publishedAt);
}

function isToday(item: NormalizedItem, now: Date): boolean {
  const latest = latestItemDate(item);
  return singaporeDayKey(latest) === singaporeDayKey(now);
}

function isThisWeek(item: NormalizedItem, now: Date): boolean {
  const latest = latestItemDate(item).getTime();
  const ageMs = now.getTime() - latest;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return ageMs >= 0 && ageMs <= sevenDaysMs && !isToday(item, now);
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function itemSearchText(item: NormalizedItem): string {
  return [
    item.title,
    item.summary,
    ...item.tags,
    ...item.topicKeywords,
  ]
    .map(normalize)
    .join(" ");
}

export function getMatchedTopicIds(item: NormalizedItem, topics: Topic[]): string[] {
  const searchText = itemSearchText(item);
  return topics
    .filter((topic) => topic.enabled)
    .filter((topic) =>
      topic.keywords.some((keyword) => searchText.includes(normalize(keyword))),
    )
    .map((topic) => topic.id);
}

function shouldWatch(item: NormalizedItem): boolean {
  if (item.importance >= 5) {
    return true;
  }

  return item.tags.some((tag) => WATCH_TAGS.has(normalize(tag)));
}

function compareItems(a: DashboardItem, b: DashboardItem): number {
  if (a.importance !== b.importance) {
    return b.importance - a.importance;
  }

  return latestItemDate(b).getTime() - latestItemDate(a).getTime();
}

function classifyItem(item: DashboardItem, now: Date): DashboardSection[] {
  const sections: DashboardSection[] = [];

  if (item.status === "ongoing") {
    sections.push("ongoing");
  }

  if (isToday(item, now)) {
    sections.push("today");
  } else if (isThisWeek(item, now)) {
    sections.push("week");
  }

  if (shouldWatch(item)) {
    sections.push("watchlist");
  }

  return sections;
}

function fallbackSource(sourceId: string): SourceConfig {
  return {
    id: sourceId,
    name: "Unknown source",
    category: "general-news",
    url: "#",
    priority: 1,
  };
}

function buildBrief(counts: Record<DashboardSection, number>): string {
  return `${counts.ongoing} ongoing stories, ${counts.today} today items, ${counts.week} week context items, and ${counts.watchlist} watchlist signals.`;
}

export function buildDashboardSnapshot(
  items: NormalizedItem[],
  sources: SourceConfig[],
  topics: Topic[],
  now = new Date(),
): DashboardSnapshot {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const grouped = Object.fromEntries(
    sectionOrder.map((section) => [section, [] as DashboardItem[]]),
  ) as Record<DashboardSection, DashboardItem[]>;

  const dashboardItems = items
    .filter((item) => item.status !== "archived")
    .map((item) => ({
      ...item,
      source: sourceById.get(item.sourceId) ?? fallbackSource(item.sourceId),
      matchedTopicIds: getMatchedTopicIds(item, topics),
    }));

  for (const item of dashboardItems) {
    for (const section of classifyItem(item, now)) {
      grouped[section].push(item);
    }
  }

  for (const section of sectionOrder) {
    grouped[section].sort(compareItems);
  }

  const counts = Object.fromEntries(
    sectionOrder.map((section) => [section, grouped[section].length]),
  ) as Record<DashboardSection, number>;

  return {
    generatedAt: now.toISOString(),
    brief: buildBrief(counts),
    sources,
    topics,
    counts,
    sections: grouped,
  };
}
```

- [ ] **Step 5: Create `app/lib/seed-data.ts`**

Write this exact file:

```ts
import type { NormalizedItem, SourceConfig, Topic } from "./types";

export const seedSources: SourceConfig[] = [
  {
    id: "reuters",
    name: "Reuters",
    category: "general-news",
    url: "https://www.reuters.com/",
    priority: 5,
  },
  {
    id: "the-verge",
    name: "The Verge",
    category: "technology",
    url: "https://www.theverge.com/",
    priority: 4,
  },
  {
    id: "openai",
    name: "OpenAI Blog",
    category: "ai-lab",
    url: "https://openai.com/news/",
    priority: 5,
  },
  {
    id: "anthropic",
    name: "Anthropic News",
    category: "ai-lab",
    url: "https://www.anthropic.com/news",
    priority: 4,
  },
  {
    id: "arxiv",
    name: "arXiv",
    category: "research",
    url: "https://arxiv.org/",
    priority: 3,
  },
  {
    id: "github",
    name: "GitHub Trending",
    category: "developer",
    url: "https://github.com/trending",
    priority: 3,
  },
];

export const defaultTopics: Topic[] = [
  { id: "ai-agents", name: "AI Agents", keywords: ["agent", "agents"], enabled: true },
  { id: "openai", name: "OpenAI", keywords: ["openai", "gpt"], enabled: true },
  { id: "chips", name: "Chips", keywords: ["chip", "chips", "semiconductor", "nvidia"], enabled: true },
  { id: "geopolitics", name: "Geopolitics", keywords: ["policy", "regulation", "geopolitics"], enabled: true },
];

function isoHoursAgo(now: Date, hoursAgo: number): string {
  return new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).toISOString();
}

export function createSeedItems(now = new Date()): NormalizedItem[] {
  return [
    {
      id: "agent-browser-rollout",
      title: "AI agent browser experiments move into wider testing",
      summary:
        "Developer previews and browser-side agent workflows are becoming a live product race across major AI labs.",
      sourceId: "the-verge",
      sourceUrl: "https://www.theverge.com/",
      publishedAt: isoHoursAgo(now, 3),
      updatedAt: isoHoursAgo(now, 1),
      tags: ["AI", "Agents", "Browsers"],
      topicKeywords: ["AI Agents", "OpenAI"],
      importance: 5,
      status: "ongoing",
    },
    {
      id: "chip-supply-policy",
      title: "Semiconductor supply and export policy stay in focus",
      summary:
        "Chip access, export controls, and AI infrastructure capacity remain active threads for markets and policy watchers.",
      sourceId: "reuters",
      sourceUrl: "https://www.reuters.com/",
      publishedAt: isoHoursAgo(now, 10),
      updatedAt: isoHoursAgo(now, 2),
      tags: ["Chips", "Policy", "Markets"],
      topicKeywords: ["chips", "geopolitics"],
      importance: 4,
      status: "ongoing",
    },
    {
      id: "openai-product-note",
      title: "OpenAI publishes a product and safety update",
      summary:
        "The update adds fresh signals about model deployment, safety framing, and the near-term product roadmap.",
      sourceId: "openai",
      sourceUrl: "https://openai.com/news/",
      publishedAt: isoHoursAgo(now, 5),
      updatedAt: isoHoursAgo(now, 5),
      tags: ["AI", "Models", "Safety"],
      topicKeywords: ["OpenAI", "GPT"],
      importance: 5,
      status: "new",
    },
    {
      id: "anthropic-agent-guidance",
      title: "Anthropic shares new guidance for agentic systems",
      summary:
        "The post gives teams another reference point for building controlled, tool-using AI systems.",
      sourceId: "anthropic",
      sourceUrl: "https://www.anthropic.com/news",
      publishedAt: isoHoursAgo(now, 22),
      updatedAt: isoHoursAgo(now, 20),
      tags: ["AI", "Agents", "Safety"],
      topicKeywords: ["AI Agents"],
      importance: 4,
      status: "new",
    },
    {
      id: "multimodal-benchmark",
      title: "Researchers release a new multimodal evaluation benchmark",
      summary:
        "A new benchmark highlights where frontier models still struggle with long-context visual reasoning.",
      sourceId: "arxiv",
      sourceUrl: "https://arxiv.org/",
      publishedAt: isoHoursAgo(now, 60),
      updatedAt: isoHoursAgo(now, 55),
      tags: ["AI", "Research", "Models"],
      topicKeywords: ["AI"],
      importance: 4,
      status: "updated",
    },
    {
      id: "open-source-coding-agent",
      title: "Open-source coding agent project climbs developer rankings",
      summary:
        "Developer interest is concentrating around local-first agents, repository context, and automated code review.",
      sourceId: "github",
      sourceUrl: "https://github.com/trending",
      publishedAt: isoHoursAgo(now, 72),
      updatedAt: isoHoursAgo(now, 48),
      tags: ["Developer", "Agents", "Open Source"],
      topicKeywords: ["AI Agents"],
      importance: 3,
      status: "updated",
    },
    {
      id: "prompt-injection-watch",
      title: "Security researchers flag a new prompt-injection pattern",
      summary:
        "The report is relevant for teams deploying agents that read untrusted pages, files, and messages.",
      sourceId: "the-verge",
      sourceUrl: "https://www.theverge.com/",
      publishedAt: isoHoursAgo(now, 98),
      updatedAt: isoHoursAgo(now, 90),
      tags: ["AI", "Security", "Agents"],
      topicKeywords: ["AI Agents"],
      importance: 5,
      status: "updated",
    },
  ];
}
```

- [ ] **Step 6: Run the data-layer test**

Run:

```powershell
npm run test
```

Expected:

```text
PASS app/lib/dashboard.test.ts
```

- [ ] **Step 7: Commit data layer**

Run:

```powershell
git add app/lib package.json package-lock.json
git commit -m "feat: add intelligence data model"
```

Expected:

```text
[master ...] feat: add intelligence data model
```

## Task 3: Add the Dashboard API and Server Page

**Files:**
- Create: `app/api/dashboard/route.ts`
- Replace: `app/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create `app/api/dashboard/route.ts`**

Write this exact file:

```ts
import { NextResponse } from "next/server";
import { buildDashboardSnapshot } from "@/app/lib/dashboard";
import { createSeedItems, defaultTopics, seedSources } from "@/app/lib/seed-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const snapshot = buildDashboardSnapshot(
    createSeedItems(now),
    seedSources,
    defaultTopics,
    now,
  );

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
```

- [ ] **Step 2: Replace `app/layout.tsx`**

Write this exact file:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daily Intelligence",
  description: "A daily dashboard for ongoing events, today, this week, and AI watchlist signals.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Replace `app/page.tsx`**

Write this exact file:

```tsx
import { DashboardShell } from "@/app/components/dashboard-shell";
import { buildDashboardSnapshot } from "@/app/lib/dashboard";
import { createSeedItems, defaultTopics, seedSources } from "@/app/lib/seed-data";

export default function Home() {
  const now = new Date();
  const snapshot = buildDashboardSnapshot(
    createSeedItems(now),
    seedSources,
    defaultTopics,
    now,
  );

  return <DashboardShell initialSnapshot={snapshot} />;
}
```

Expected after this step: TypeScript will not compile until `DashboardShell` is created in Task 4.

## Task 4: Build the Interactive Dashboard UI

**Files:**
- Create: `app/components/dashboard-shell.tsx`
- Create: `app/components/section-panel.tsx`
- Create: `app/components/insight-card.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Create `app/components/insight-card.tsx`**

Write this exact file:

```tsx
import { ExternalLink } from "lucide-react";
import type { DashboardItem } from "@/app/lib/types";

const formatter = new Intl.DateTimeFormat("zh-CN", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function importanceLabel(importance: number): string {
  if (importance >= 5) return "High";
  if (importance >= 4) return "Elevated";
  return "Normal";
}

export function InsightCard({ item }: { item: DashboardItem }) {
  const updatedAt = formatter.format(new Date(item.updatedAt));

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="font-medium text-slate-700">{item.source.name}</span>
        <span>{updatedAt}</span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
          {importanceLabel(item.importance)}
        </span>
      </div>

      <h3 className="mt-3 text-base font-semibold leading-6 text-slate-950">
        {item.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-cyan-700 hover:text-cyan-900"
          aria-label={`Open source for ${item.title}`}
        >
          Source
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Create `app/components/section-panel.tsx`**

Write this exact file:

```tsx
import type { DashboardItem } from "@/app/lib/types";
import { InsightCard } from "./insight-card";

type SectionPanelProps = {
  title: string;
  description: string;
  items: DashboardItem[];
};

export function SectionPanel({ title, description, items }: SectionPanelProps) {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-sm font-medium text-slate-600">
          {items.length}
        </span>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <InsightCard key={`${title}-${item.id}`} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-500">
          No matching items in this view.
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Create `app/components/dashboard-shell.tsx`**

Write this exact file:

```tsx
"use client";

import {
  Activity,
  CalendarDays,
  Flame,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { SectionPanel } from "./section-panel";
import type {
  DashboardItem,
  DashboardSection,
  DashboardSnapshot,
  Topic,
} from "@/app/lib/types";

const topicStorageKey = "daily-intelligence-topics-v1";

const sectionMeta: Record<
  DashboardSection,
  { title: string; description: string; icon: React.ComponentType<{ className?: string }> }
> = {
  ongoing: {
    title: "正在进行中",
    description: "仍在发展、可能继续更新的事件。",
    icon: Activity,
  },
  today: {
    title: "今天发生",
    description: "今天新增或刚刚更新的重要信息。",
    icon: CalendarDays,
  },
  week: {
    title: "这周发生",
    description: "过去 7 天里形成脉络的重点变化。",
    icon: Search,
  },
  watchlist: {
    title: "需要关注",
    description: "新闻热点和 AI/科技领域的高信号动态。",
    icon: Flame,
  },
};

function formatGeneratedAt(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function slugTopicName(name: string): string {
  return normalize(name)
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function itemMatchesTopic(item: DashboardItem, topic: Topic): boolean {
  const haystack = [
    item.title,
    item.summary,
    ...item.tags,
    ...item.topicKeywords,
    ...item.matchedTopicIds,
  ]
    .map(normalize)
    .join(" ");

  return topic.keywords.some((keyword) => haystack.includes(normalize(keyword)));
}

function filterSections(
  snapshot: DashboardSnapshot,
  selectedTopicId: string,
  topics: Topic[],
): DashboardSnapshot["sections"] {
  if (selectedTopicId === "all") {
    return snapshot.sections;
  }

  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId);
  if (!selectedTopic) {
    return snapshot.sections;
  }

  return Object.fromEntries(
    Object.entries(snapshot.sections).map(([section, items]) => [
      section,
      items.filter((item) => itemMatchesTopic(item, selectedTopic)),
    ]),
  ) as DashboardSnapshot["sections"];
}

function mergeTopics(existing: Topic[], incoming: Topic[]): Topic[] {
  const map = new Map(existing.map((topic) => [topic.id, topic]));
  for (const topic of incoming) {
    if (!map.has(topic.id)) {
      map.set(topic.id, topic);
    }
  }
  return Array.from(map.values());
}

export function DashboardShell({
  initialSnapshot,
}: {
  initialSnapshot: DashboardSnapshot;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [topics, setTopics] = useState(initialSnapshot.topics);
  const [selectedTopicId, setSelectedTopicId] = useState("all");
  const [draftTopic, setDraftTopic] = useState("");
  const [refreshState, setRefreshState] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    const stored = window.localStorage.getItem(topicStorageKey);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as Topic[];
      setTopics(mergeTopics(parsed, initialSnapshot.topics));
    } catch {
      window.localStorage.removeItem(topicStorageKey);
    }
  }, [initialSnapshot.topics]);

  useEffect(() => {
    window.localStorage.setItem(topicStorageKey, JSON.stringify(topics));
  }, [topics]);

  const visibleSections = useMemo(
    () => filterSections(snapshot, selectedTopicId, topics),
    [snapshot, selectedTopicId, topics],
  );

  const visibleCounts = useMemo(
    () => ({
      ongoing: visibleSections.ongoing.length,
      today: visibleSections.today.length,
      week: visibleSections.week.length,
      watchlist: visibleSections.watchlist.length,
    }),
    [visibleSections],
  );

  function addTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draftTopic.trim();
    if (!name) return;

    const id = slugTopicName(name) || `topic-${Date.now()}`;
    setTopics((current) => {
      if (current.some((topic) => topic.id === id)) {
        return current;
      }
      return [...current, { id, name, keywords: [name], enabled: true }];
    });
    setSelectedTopicId(id);
    setDraftTopic("");
  }

  function removeTopic(topicId: string) {
    setTopics((current) => current.filter((topic) => topic.id !== topicId));
    if (selectedTopicId === topicId) {
      setSelectedTopicId("all");
    }
  }

  async function refreshDashboard() {
    setRefreshState("loading");
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Refresh failed");
      }
      const nextSnapshot = (await response.json()) as DashboardSnapshot;
      setSnapshot(nextSnapshot);
      setTopics((current) => mergeTopics(current, nextSnapshot.topics));
      setRefreshState("idle");
    } catch {
      setRefreshState("error");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="grid gap-4 border-b border-slate-200 pb-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-medium text-cyan-700">Daily Intelligence</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
              现在发生了什么
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {snapshot.brief}
            </p>
          </div>
          <button
            type="button"
            onClick={refreshDashboard}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-500"
            disabled={refreshState === "loading"}
          >
            <RefreshCw
              className={`size-4 ${refreshState === "loading" ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            刷新
          </button>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(sectionMeta) as DashboardSection[]).map((section) => {
            const Icon = sectionMeta[section].icon;
            return (
              <div key={section} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-600">
                    {sectionMeta[section].title}
                  </span>
                  <Icon className="size-4 text-cyan-700" aria-hidden="true" />
                </div>
                <p className="mt-3 text-3xl font-semibold text-slate-950">
                  {visibleCounts[section]}
                </p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-cyan-700" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-slate-950">关注主题</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Last updated {formatGeneratedAt(snapshot.generatedAt)}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedTopicId("all")}
                className={`rounded-md px-2.5 py-1.5 text-sm font-medium ${
                  selectedTopicId === "all"
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                全部
              </button>
              {topics.map((topic) => (
                <span key={topic.id} className="inline-flex items-center rounded-md bg-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`px-2.5 py-1.5 text-sm font-medium ${
                      selectedTopicId === topic.id
                        ? "bg-cyan-700 text-white"
                        : "text-slate-700 hover:text-slate-950"
                    } rounded-l-md`}
                  >
                    {topic.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTopic(topic.id)}
                    className="px-1.5 text-slate-400 hover:text-rose-600"
                    aria-label={`Remove ${topic.name}`}
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>

            <form className="mt-4 flex gap-2" onSubmit={addTopic}>
              <input
                value={draftTopic}
                onChange={(event) => setDraftTopic(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-cyan-600/20 focus:border-cyan-700 focus:ring-4"
                aria-label="New topic"
              />
              <button
                type="submit"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-cyan-700 text-white hover:bg-cyan-800"
                aria-label="Add topic"
              >
                <Plus className="size-4" aria-hidden="true" />
              </button>
            </form>

            {refreshState === "error" ? (
              <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">
                Refresh failed. The previous dashboard is still visible.
              </p>
            ) : null}
          </aside>

          <div className="grid gap-6 xl:grid-cols-2">
            {(Object.keys(sectionMeta) as DashboardSection[]).map((section) => (
              <SectionPanel
                key={section}
                title={sectionMeta[section].title}
                description={sectionMeta[section].description}
                items={visibleSections[section]}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Replace `app/globals.css`**

Write this exact file:

```css
@import "tailwindcss";

:root {
  --background: #f1f5f9;
  --foreground: #0f172a;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

* {
  box-sizing: border-box;
}

html {
  background: var(--background);
}

body {
  min-height: 100vh;
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}

a {
  text-decoration: none;
}
```

- [ ] **Step 5: Run UI type and lint checks**

Run:

```powershell
npm run lint
npm run test
```

Expected:

```text
lint exits 0
PASS app/lib/dashboard.test.ts
```

- [ ] **Step 6: Commit UI**

Run:

```powershell
git add app
git commit -m "feat: build daily intelligence dashboard"
```

Expected:

```text
[master ...] feat: build daily intelligence dashboard
```

## Task 5: Validate Locally and Publish with Sites

**Files:**
- Read: `.openai/hosting.json`
- Build output: `dist/`
- Package artifact: temporary archive outside `outputs`

- [ ] **Step 1: Run the deployment build**

Run:

```powershell
npm run build
```

Expected:

```text
vinext build exits 0
dist/server/index.js exists
```

- [ ] **Step 2: Start the local dev server**

Run as a background process:

```powershell
npm run dev
```

Expected:

```text
Local server prints an http://localhost:<port> URL
```

- [ ] **Step 3: Open the meaningful preview**

Use the Sites/browser preview handoff with the exact healthy localhost URL printed by the server.

Expected:

```text
The app browser opens the dashboard route
```

- [ ] **Step 4: Commit validation-ready source**

Run:

```powershell
git status --short
git add .
git commit -m "chore: validate daily intelligence site"
```

Expected if there are new validation-related tracked changes:

```text
[master ...] chore: validate daily intelligence site
```

Expected if there are no tracked changes:

```text
nothing to commit, working tree clean
```

- [ ] **Step 5: Prepare and publish through Sites**

Use the Sites hosting flow:

1. Create or reuse the Sites project from `.openai/hosting.json`.
2. Push the exact source commit used for the build with the Sites source credential.
3. Stage the build output so the archive root is `dist/`.
4. Ensure the staged archive contains `dist/server/index.js`, static assets, and `dist/.openai/hosting.json`.
5. Save a site version with the pushed commit SHA.
6. Deploy the saved private site version.
7. Poll deployment status until it reaches a terminal state.

Expected:

```text
Sites deployment reaches a terminal successful state and returns a production URL
```

## Self-Review

- Spec coverage: Task 2 covers source, topic, item, and snapshot contracts. Task 3 covers API refresh and server snapshot generation. Task 4 covers the four requested views, topic configuration, counts, source links, and refresh/error state. Task 5 covers build, local preview, and deployment.
- Scope: Version 1 uses browser storage for topics and seed source adapters shaped like public-source ingestion. It does not add accounts, paid APIs, scheduled ingestion, notifications, or deep archive search.
- Type consistency: `SourceConfig`, `Topic`, `NormalizedItem`, `DashboardItem`, `DashboardSnapshot`, and `DashboardSection` are defined once in `app/lib/types.ts` and used consistently by the data layer, API, page, and components.
- Validation: The plan includes a failing test first, then implementation, `npm run test`, `npm run lint`, `npm run build`, local preview, commits, and Sites deployment.
