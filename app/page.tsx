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
