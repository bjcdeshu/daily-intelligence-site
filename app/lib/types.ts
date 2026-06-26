export type SourceCategory =
  | "ai-lab"
  | "general-news"
  | "tech-news"
  | "research"
  | "developer"
  | "social"
  | "unknown";

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
  sections: Record<DashboardSection, DashboardItem[]>;
  counts: Record<DashboardSection, number>;
  brief: string;
};
