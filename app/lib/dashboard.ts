import type {
  DashboardItem,
  DashboardSection,
  DashboardSnapshot,
  NormalizedItem,
  SourceConfig,
  Topic,
} from "./types";

const SINGAPORE_OFFSET_HOURS = 8;
const DAY_MS = 24 * 60 * 60 * 1000;

export const WATCH_TAGS = new Set([
  "ai",
  "agents",
  "models",
  "research",
  "security",
  "chips",
  "policy",
]);

export function getMatchedTopicIds(item: NormalizedItem, topics: Topic[]): string[] {
  const haystack = [
    item.title,
    item.summary,
    ...item.tags,
    ...item.topicKeywords,
  ]
    .join(" ")
    .toLocaleLowerCase()
    .trim()
    .replace(/\s+/g, " ");

  return topics
    .filter((topic) => topic.enabled)
    .filter((topic) =>
      topic.keywords.some((keyword) => keywordMatches(haystack, keyword)),
    )
    .map((topic) => topic.id);
}

export function buildDashboardSnapshot(
  items: NormalizedItem[],
  sources: SourceConfig[],
  topics: Topic[],
  now = new Date(),
  dataMode: DashboardSnapshot["dataMode"] = "demo",
): DashboardSnapshot {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const todayStart = getSingaporeDayStart(now);
  const tomorrowStart = new Date(todayStart.getTime() + DAY_MS);
  const weekStart = new Date(todayStart.getTime() - 7 * DAY_MS);
  const sections: Record<DashboardSection, DashboardItem[]> = {
    ongoing: [],
    today: [],
    week: [],
    watchlist: [],
  };

  for (const item of items) {
    if (item.status === "archived") {
      continue;
    }

    const dashboardItem: DashboardItem = {
      ...item,
      source: sourceById.get(item.sourceId) ?? createFallbackSource(item),
      matchedTopicIds: getMatchedTopicIds(item, topics),
    };
    const activityAt = new Date(item.updatedAt || item.publishedAt);

    if (item.status === "ongoing") {
      sections.ongoing.push(dashboardItem);
    }

    if (activityAt >= todayStart && activityAt < tomorrowStart) {
      sections.today.push(dashboardItem);
    } else if (activityAt >= weekStart && activityAt < todayStart) {
      sections.week.push(dashboardItem);
    }

    if (isWatchItem(item)) {
      sections.watchlist.push(dashboardItem);
    }
  }

  for (const section of Object.values(sections)) {
    section.sort(compareDashboardItems);
  }

  const counts = {
    ongoing: sections.ongoing.length,
    today: sections.today.length,
    week: sections.week.length,
    watchlist: sections.watchlist.length,
  };

  return {
    generatedAt: now.toISOString(),
    dataMode,
    sources,
    topics,
    sections,
    counts,
    brief: `${counts.ongoing} 条持续追踪 · ${counts.today} 条今日动态 · ${counts.week} 条近 7 天资讯 · ${counts.watchlist} 条需要关注`,
  };
}

function compareDashboardItems(a: DashboardItem, b: DashboardItem): number {
  if (a.importance !== b.importance) {
    return b.importance - a.importance;
  }

  return getLatestActivityTime(b) - getLatestActivityTime(a);
}

function getSingaporeDayStart(date: Date): Date {
  const singaporeTime = new Date(date.getTime() + SINGAPORE_OFFSET_HOURS * 60 * 60 * 1000);

  return new Date(Date.UTC(
    singaporeTime.getUTCFullYear(),
    singaporeTime.getUTCMonth(),
    singaporeTime.getUTCDate(),
    -SINGAPORE_OFFSET_HOURS,
  ));
}

function isWatchItem(item: NormalizedItem): boolean {
  if (item.importance >= 5) {
    return true;
  }

  return item.tags.some((tag) =>
    WATCH_TAGS.has(normalizeText(tag)),
  );
}

function getLatestActivityTime(item: NormalizedItem): number {
  return new Date(item.updatedAt || item.publishedAt).getTime();
}

function createFallbackSource(item: NormalizedItem): SourceConfig {
  return {
    id: item.sourceId,
    name: item.sourceId,
    category: "general-news",
    url: item.sourceUrl,
    priority: 0,
  };
}

function keywordMatches(haystack: string, rawKeyword: string): boolean {
  const keyword = normalizeText(rawKeyword);

  if (!keyword) {
    return false;
  }

  if (!isAscii(keyword)) {
    return haystack.includes(keyword);
  }

  const pattern = keyword
    .split(" ")
    .map(escapeRegExp)
    .join("\\s+");
  const boundaryPattern = `(^|[^a-z0-9])${pattern}($|[^a-z0-9])`;

  return new RegExp(boundaryPattern, "i").test(haystack);
}

function normalizeText(value: string): string {
  return value.toLocaleLowerCase().trim().replace(/\s+/g, " ");
}

function isAscii(value: string): boolean {
  return /^[\x00-\x7F]+$/.test(value);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
