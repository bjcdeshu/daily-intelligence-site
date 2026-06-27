import { ExternalLink } from "lucide-react";
import type { DashboardItem } from "@/app/lib/types";

type InsightCardProps = {
  item: DashboardItem;
};

const importanceLabels = {
  high: "High",
  elevated: "Elevated",
  normal: "Normal",
};

export function InsightCard({ item }: InsightCardProps) {
  const updatedAt = item.updatedAt || item.publishedAt;
  const importanceLabel =
    item.importance >= 5
      ? importanceLabels.high
      : item.importance >= 4
        ? importanceLabels.elevated
        : importanceLabels.normal;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500">
        <span className="font-medium text-slate-700">{item.source.name}</span>
        <time dateTime={updatedAt}>{formatUpdatedTime(updatedAt)}</time>
        <span className="inline-flex h-6 min-w-16 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 font-medium text-slate-700">
          {importanceLabel}
        </span>
      </div>

      <h3 className="mt-3 text-base font-semibold leading-snug text-slate-950">
        {item.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex h-6 items-center rounded-md bg-slate-100 px-2 text-xs font-medium text-slate-600"
          >
            {tag}
          </span>
        ))}
      </div>

      <a
        className="mt-4 inline-flex h-8 items-center gap-2 text-sm font-medium text-slate-800 hover:text-slate-950"
        href={item.sourceUrl}
        target="_blank"
        rel="noreferrer"
      >
        <ExternalLink className="size-4" aria-hidden="true" />
        Source
      </a>
    </article>
  );
}

function formatUpdatedTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Singapore",
  }).format(new Date(value));
}
