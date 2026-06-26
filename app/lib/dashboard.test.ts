import { describe, expect, it } from "vitest";
import { buildDashboardSnapshot, getMatchedTopicIds } from "./dashboard";
import type { NormalizedItem, SourceConfig, Topic } from "./types";

const sources: SourceConfig[] = [
  { id: "openai", name: "OpenAI Blog", category: "ai-lab", url: "https://openai.com/news/", priority: 5 },
  { id: "global-wire", name: "Global Wire", category: "general-news", url: "https://example.com/world", priority: 4 },
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
    id: "updated-today-from-week",
    title: "Markets digest this week's logistics update",
    summary: "A regional logistics story first published earlier this week has fresh market impact today.",
    sourceId: "global-wire",
    sourceUrl: "https://example.com/markets/logistics",
    publishedAt: "2026-06-24T11:00:00+08:00",
    updatedAt: "2026-06-27T07:30:00+08:00",
    tags: ["Markets", "Logistics"],
    topicKeywords: ["supply chains"],
    importance: 2,
    status: "updated",
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
    expect(snapshot.sections.today.map((item) => item.id)).toEqual(["ongoing-agent", "today-market", "updated-today-from-week"]);
    expect(snapshot.sections.week.map((item) => item.id)).toEqual(["week-policy"]);
    expect(snapshot.sections.watchlist.map((item) => item.id)).toEqual(["ongoing-agent", "today-market", "week-policy"]);
    expect(snapshot.counts).toEqual({ ongoing: 1, today: 3, week: 1, watchlist: 3 });
    expect(snapshot.sources).toEqual(sources);
    expect(snapshot.topics).toEqual(topics);
    expect(snapshot.brief).toContain("1 ongoing");
    expect(snapshot.brief).toContain("3 today");
  });
});
