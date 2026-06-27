import { InsightCard } from "@/app/components/insight-card";
import type { DashboardItem } from "@/app/lib/types";

type SectionPanelProps = {
  title: string;
  description: string;
  items: DashboardItem[];
};

export function SectionPanel({ title, description, items }: SectionPanelProps) {
  return (
    <section className="min-w-0">
      <div className="mb-4 flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <span className="inline-flex h-8 min-w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-700">
          {items.length}
        </span>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <InsightCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
          No matching items in this view.
        </div>
      )}
    </section>
  );
}
