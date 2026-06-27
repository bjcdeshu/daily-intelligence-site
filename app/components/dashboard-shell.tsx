"use client";

import {
  AlertCircle,
  CalendarDays,
  Clock3,
  Eye,
  ListFilter,
  Plus,
  Radio,
  RefreshCw,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type FormEvent,
} from "react";
import { SectionPanel } from "@/app/components/section-panel";
import type {
  DashboardItem,
  DashboardSection,
  DashboardSnapshot,
  Topic,
} from "@/app/lib/types";

type DashboardShellProps = {
  initialSnapshot: DashboardSnapshot;
};

type SectionConfig = {
  id: DashboardSection;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const TOPICS_STORAGE_KEY = "daily-intelligence-topics-v1";

const sectionConfigs: SectionConfig[] = [
  {
    id: "ongoing",
    title: "正在进行中",
    description: "仍在发展、可能继续更新的事件。",
    icon: Radio,
  },
  {
    id: "today",
    title: "今天发生",
    description: "今天新增或刚刚更新的重要信息。",
    icon: CalendarDays,
  },
  {
    id: "week",
    title: "这周发生",
    description: "过去 7 天里形成脉络的重点变化。",
    icon: Clock3,
  },
  {
    id: "watchlist",
    title: "需要关注",
    description: "新闻热点和 AI/科技领域的高信号动态。",
    icon: Eye,
  },
];

export function DashboardShell({ initialSnapshot }: DashboardShellProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [topics, setTopics] = useState(initialSnapshot.topics);
  const [selectedTopicId, setSelectedTopicId] = useState("all");
  const [topicName, setTopicName] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const didLoadStoredTopics = useRef(false);

  const serverTopicIds = useMemo(
    () => new Set(snapshot.topics.map((topic) => topic.id)),
    [snapshot.topics],
  );

  useEffect(() => {
    queueMicrotask(() => {
      setTopics(mergeTopics(initialSnapshot.topics, safeReadStoredTopics()));
      didLoadStoredTopics.current = true;
    });
  }, [initialSnapshot.topics]);

  useEffect(() => {
    if (!didLoadStoredTopics.current) {
      return;
    }

    safeWriteStoredTopics(
      topics.filter((topic) => !serverTopicIds.has(topic.id)),
    );
  }, [serverTopicIds, topics]);

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.id === selectedTopicId),
    [selectedTopicId, topics],
  );

  const visibleSections = useMemo(() => {
    if (selectedTopicId === "all" || !selectedTopic) {
      return snapshot.sections;
    }

    return Object.fromEntries(
      sectionConfigs.map((section) => [
        section.id,
        snapshot.sections[section.id].filter((item) =>
          itemMatchesTopic(item, selectedTopic),
        ),
      ]),
    ) as DashboardSnapshot["sections"];
  }, [selectedTopic, selectedTopicId, snapshot.sections]);

  const visibleCounts = useMemo(
    () =>
      Object.fromEntries(
        sectionConfigs.map((section) => [
          section.id,
          visibleSections[section.id].length,
        ]),
      ) as DashboardSnapshot["counts"],
    [visibleSections],
  );

  function addTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = topicName.trim();

    if (!name) {
      return;
    }

    const equivalentTopic = findEquivalentTopic(name, topics);

    if (equivalentTopic) {
      setSelectedTopicId(equivalentTopic.id);
      setTopicName("");
      return;
    }

    const id = createTopicId(name, topics);
    setTopics((currentTopics) => [
      ...currentTopics,
      {
        id,
        name,
        keywords: [name],
        enabled: true,
      },
    ]);
    setSelectedTopicId(id);
    setTopicName("");
  }

  function removeTopic(topicId: string) {
    if (serverTopicIds.has(topicId)) {
      return;
    }

    setTopics((currentTopics) =>
      currentTopics.filter((topic) => topic.id !== topicId),
    );

    if (selectedTopicId === topicId) {
      setSelectedTopicId("all");
    }
  }

  async function refreshDashboard() {
    setIsRefreshing(true);
    setRefreshError(null);

    try {
      const response = await fetch("/api/dashboard", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Refresh failed with ${response.status}`);
      }

      const nextSnapshot = (await response.json()) as DashboardSnapshot;
      setSnapshot(nextSnapshot);
      setTopics((currentTopics) => mergeTopics(nextSnapshot.topics, currentTopics));
    } catch (error) {
      setRefreshError(
        error instanceof Error ? error.message : "Unable to refresh dashboard.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {formatGeneratedAt(snapshot.generatedAt)}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
            现在发生了什么
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {snapshot.brief}
          </p>
        </div>
        <button
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-32"
          type="button"
          onClick={refreshDashboard}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          刷新
        </button>
      </header>

      {refreshError ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          <span>{refreshError}</span>
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {sectionConfigs.map((section) => (
          <CountTile
            key={section.id}
            icon={section.icon}
            label={section.title}
            count={visibleCounts[section.id]}
          />
        ))}
      </section>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-950">关注主题</h2>
            <ListFilter className="size-4 text-slate-500" aria-hidden="true" />
          </div>

          <div className="grid gap-2">
            <button
              className={topicButtonClass(selectedTopicId === "all")}
              type="button"
              onClick={() => setSelectedTopicId("all")}
            >
              <span className="truncate">全部</span>
              <span className="inline-flex h-6 min-w-8 items-center justify-center rounded-md bg-slate-100 px-2 text-xs font-semibold text-slate-600">
                {sumCounts(visibleCounts)}
              </span>
            </button>

            {topics.map((topic) => {
              const isServerTopic = serverTopicIds.has(topic.id);

              return (
                <div key={topic.id} className="flex gap-2">
                  <button
                    className={topicButtonClass(selectedTopicId === topic.id)}
                    type="button"
                    onClick={() => setSelectedTopicId(topic.id)}
                  >
                    <span className="truncate">{topic.name}</span>
                  </button>
                  {!isServerTopic ? (
                    <button
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      type="button"
                      onClick={() => removeTopic(topic.id)}
                      aria-label={`移除 ${topic.name}`}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>

          <form className="mt-4 flex gap-2" onSubmit={addTopic}>
            <input
              className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              value={topicName}
              onChange={(event) => setTopicName(event.target.value)}
              aria-label="添加关注主题"
              placeholder="添加主题"
            />
            <button
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white transition hover:bg-slate-800"
              type="submit"
              aria-label="添加主题"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </form>
        </aside>

        <div className="grid min-w-0 gap-8">
          {sectionConfigs.map((section) => (
            <SectionPanel
              key={section.id}
              title={section.title}
              description={section.description}
              items={visibleSections[section.id]}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function CountTile({
  icon: Icon,
  label,
  count,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  count: number;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <Icon className="size-4 text-slate-500" aria-hidden="true" />
      </div>
      <div className="mt-3 text-3xl font-semibold text-slate-950">{count}</div>
    </div>
  );
}

function topicButtonClass(isSelected: boolean): string {
  return [
    "inline-flex h-9 min-w-0 flex-1 items-center justify-between gap-3 rounded-md border px-3 text-left text-sm font-medium transition",
    isSelected
      ? "border-slate-950 bg-slate-950 text-white"
      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
  ].join(" ");
}

function itemMatchesTopic(item: DashboardItem, topic: Topic): boolean {
  if (item.matchedTopicIds.some((id) => includesNormalized(id, topic.id))) {
    return true;
  }

  const searchableText = [
    item.title,
    item.summary,
    ...item.tags,
    ...item.topicKeywords,
    ...item.matchedTopicIds,
  ]
    .map(normalizeText)
    .join(" ");

  return topic.keywords
    .map(normalizeText)
    .filter(Boolean)
    .some((keyword) => searchableText.includes(keyword));
}

function includesNormalized(value: string, query: string): boolean {
  const normalizedQuery = normalizeText(query);

  return Boolean(normalizedQuery) && normalizeText(value).includes(normalizedQuery);
}

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function mergeTopics(primaryTopics: Topic[], secondaryTopics: Topic[]): Topic[] {
  const topicMap = new Map(primaryTopics.map((topic) => [topic.id, topic]));

  for (const topic of secondaryTopics) {
    const hasEquivalentTopic = findEquivalentTopic(
      topic.name,
      Array.from(topicMap.values()),
    );

    if (!topicMap.has(topic.id) && !hasEquivalentTopic) {
      topicMap.set(topic.id, topic);
    }
  }

  return Array.from(topicMap.values());
}

function findEquivalentTopic(name: string, topics: Topic[]): Topic | undefined {
  const normalizedName = normalizeText(name);

  if (!normalizedName) {
    return undefined;
  }

  return topics.find((topic) => {
    const normalizedTopicValues = [topic.name, ...topic.keywords]
      .map(normalizeText)
      .filter(Boolean);

    return normalizedTopicValues.includes(normalizedName);
  });
}

function safeReadStoredTopics(): Topic[] {
  if (typeof window === "undefined") {
    return [];
  }

  let storedTopics: string | null;

  try {
    storedTopics = window.localStorage.getItem(TOPICS_STORAGE_KEY);
  } catch {
    return [];
  }

  if (!storedTopics) {
    return [];
  }

  try {
    const parsedTopics = JSON.parse(storedTopics);

    if (Array.isArray(parsedTopics)) {
      return parsedTopics.filter(isTopic);
    }
  } catch {
    safeRemoveStoredTopics();
  }

  return [];
}

function safeWriteStoredTopics(topics: Topic[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(topics));
  } catch {
    return;
  }
}

function safeRemoveStoredTopics(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(TOPICS_STORAGE_KEY);
  } catch {
    return;
  }
}

function isTopic(value: unknown): value is Topic {
  if (!value || typeof value !== "object") {
    return false;
  }

  const topic = value as Partial<Topic>;

  return (
    typeof topic.id === "string" &&
    typeof topic.name === "string" &&
    Array.isArray(topic.keywords) &&
    topic.keywords.every((keyword) => typeof keyword === "string") &&
    typeof topic.enabled === "boolean"
  );
}

function createTopicId(name: string, topics: Topic[]): string {
  const usedIds = new Set(topics.map((topic) => topic.id));
  const slug = name
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const baseId = slug ? `topic-${slug}` : `topic-${Date.now()}`;
  let id = baseId;
  let index = 2;

  while (usedIds.has(id)) {
    id = `${baseId}-${index}`;
    index += 1;
  }

  return id;
}

function sumCounts(counts: DashboardSnapshot["counts"]): number {
  return counts.ongoing + counts.today + counts.week + counts.watchlist;
}

function formatGeneratedAt(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
