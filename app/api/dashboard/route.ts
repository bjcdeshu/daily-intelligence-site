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
