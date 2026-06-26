# Daily Intelligence Site Design

## Goal

Build a first version of a daily intelligence website that answers: "What is happening now, today, this week, and what should I keep watching?"

The site focuses on automatic collection from public information sources. It should also let the user configure topics they care about, so incoming items can be grouped around ongoing interests without requiring manual news entry.

## First-Version Scope

The first version will be an automatic public-information dashboard with four primary views:

1. Ongoing: developing stories or topics that are still changing.
2. Today: important items published or updated today.
3. This week: important items from the current week, organized into a readable weekly picture.
4. Watchlist: high-attention news topics and AI or technology dynamics worth monitoring.

The user can maintain a list of tracked topics, such as "AI agents", "OpenAI", "chips", "geopolitics", or any custom topic. The user does not manually add news items in the first version.

## Users and Use Cases

The primary user wants a fast daily overview without opening many news and technology sites one by one.

Key use cases:

- Open the site and immediately understand the current situation.
- See what changed today.
- Review the week's important developments.
- Track AI and technology dynamics alongside broader news hotspots.
- Add, edit, or remove topics that should be watched.
- Click through to original public sources when more detail is needed.

## Information Sources

The first version should model automatic ingestion from public sources. The implementation should keep sources configurable rather than hard-coded deeply into the interface.

Initial source categories:

- General news and world events.
- Technology and AI news.
- Company and lab updates, especially AI labs.
- Developer and research signals, such as open-source, papers, or technical announcements.

The first implementation may use seeded public-source style data and a refresh-ready data layer if live source credentials or specific RSS/API details are not available yet. The product shape must still be built as if real public sources are feeding it.

## Core Experience

The first screen should be the working dashboard, not a landing page.

Top summary area:

- Current date and last refresh time.
- Short "today's brief" summary.
- Counts for ongoing stories, today's items, this week's items, and watchlist hotspots.

Topic controls:

- A compact area for tracked topics.
- Add topic.
- Edit or remove topic.
- Filter the dashboard by topic.

Main information area:

- Four sections for Ongoing, Today, This Week, and Watchlist.
- Each section shows concise cards or rows with title, source, time, summary, tags, importance, and original link.
- Items should be scannable and dense enough for daily use.

Item details:

- Selecting an item shows a fuller summary, source link, related topics, and why it appears in the current section.
- Ongoing stories may include a short timeline-style list of recent updates.

## Data Model

Source:

- id
- name
- category
- url
- trust or priority level

Topic:

- id
- name
- keywords
- enabled

Item:

- id
- title
- summary
- source id
- source url
- published or updated time
- tags
- matched topic ids
- section assignment
- importance level
- status: new, updated, ongoing, archived

Dashboard snapshot:

- generated time
- brief summary
- counts
- grouped item ids

## Architecture

Use the Sites vinext starter for a Cloudflare Worker-compatible site.

Recommended first-version architecture:

- React UI for the dashboard and topic controls.
- A narrow server/data layer that returns dashboard data and topic configuration.
- Browser storage for local topic preferences in the first version, unless durable cross-device persistence is explicitly required later.
- A source adapter shape that can later connect to real RSS/API feeds without rewriting the UI.

This keeps the first version useful and deployable while preserving a clear path to real scheduled ingestion later.

## Data Flow

1. Source adapters normalize public-source items into the shared Item shape.
2. A classifier groups each item into Ongoing, Today, This Week, or Watchlist.
3. Topic matching attaches user-tracked topics to relevant items.
4. A dashboard snapshot is generated for rendering.
5. The UI reads the snapshot, applies topic filters, and renders sections.

For the first version, source adapters may return curated seed data that mimics live public-source output. The UI and data boundaries should be built so real source fetching can replace the seed layer.

## Error Handling

- If refresh fails, keep the previous dashboard visible and show a compact stale-data state.
- If a source has no items, omit noisy empty-source errors from the main dashboard.
- If no topic matches exist, show unfiltered important items and let the user adjust tracked topics.
- If original links are missing or invalid in seed data, keep the item visible but disable the link affordance.

## Testing and Validation

Minimum validation for the first implementation:

- Build succeeds with the site deployment build command.
- Dashboard renders all four sections.
- Topic add, remove, and filtering work locally.
- Empty states render for each section.
- Seed-source data is transformed through the same normalized Item shape expected from future real sources.

## Out of Scope for Version 1

- User accounts.
- Paid news APIs.
- Full historical archive search.
- Multi-user shared workspaces.
- AI-generated long reports.
- Notification delivery.
- Production scheduled ingestion jobs.

These can be added after the core dashboard proves useful.
