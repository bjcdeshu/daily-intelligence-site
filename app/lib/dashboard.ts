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

const FALLBACK_SOURCE: SourceConfig = {
  id: "unknown",
  name: "Unknown source",
  category: "general-news",
  url: "#",
  priority: 0,
};

export function getMatchedTopicIds(item: NormalizedItem, topics: Topic[]): string[] {
  const haystack = [
    item.title,
    item.summary,
    ...item.tags,
    ...item.topicKeywords,
  ]
    .join(" ")
    .toLocaleLowerCase();

  return topics
    .filter((topic) => topic.enabled)
    .filter((topic) =>
      topic.keywords.some((keyword) =>
        haystack.includes(keyword.toLocaleLowerCase()),
      ),
    )
    .map((topic) => topic.id);
}

export function buildDashboardSnapshot(
  items: NormalizedItem[],
  sources: SourceConfig[],
  topics: Topic[],
  now = new Date(),
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
      source: sourceById.get(item.sourceId) ?? FALLBACK_SOURCE,
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
    sources,
    topics,
    sections,
    counts,
    brief: `${counts.ongoing} ongoing, ${counts.today} today, ${counts.week} this week, ${counts.watchlist} on watchlist`,
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
    WATCH_TAGS.has(tag.toLocaleLowerCase()),
  );
}

function getLatestActivityTime(item: NormalizedItem): number {
  return new Date(item.updatedAt || item.publishedAt).getTime();
}
