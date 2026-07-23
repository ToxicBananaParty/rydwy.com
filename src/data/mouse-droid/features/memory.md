## Memory

Read your whole Memory Palace right inside Mouse Droid — no Obsidian, no browser, no
setup. The **Memory** tab renders your vault natively: a collapsible **folder tree**,
**breadcrumbs**, wiki-links and backlinks, note transclusion, callouts, Mermaid diagrams,
images, a force-directed graph, and full-text search. It updates live as your notes
change, and works completely offline.

Notes under `.palace/`, `.obsidian/`, `03_archive/`, and `04_templates/` are hidden by
default (configurable in Settings).

Want to share a note? **Share…** exports the current note as a single self-contained
HTML file (images inlined) and reveals it in Finder.

## Maintenance

Mouse Droid can groom his own memory vault on a schedule: a daily *doctor sweep* (health check; re-indexes stale embeddings), a daily *hub refresh* (keeps every project hub's "Mouse Droid Summary" section current — including projects you haven't touched lately), and a weekly *autolink sweep* (adds missing wiki-links between related notes, only while you're away). Everything is off by default — enable the master switch and individual jobs in Settings → Maintenance. Each run is recorded in Memory → Maintenance, so you can always see what he did and when; heavy jobs wait until you're idle, and every change is capped per run and versioned by the vault's history.

The heaviest job, *inbox triage*, is different: instead of acting on its own it files **proposals** — one per topic, each showing new notes to create (with where they'll go), precise edits to existing notes (shown as diffs), and sessions to mark as processed — so you can approve one topic, reject another, or send one back with feedback and get a revised proposal in its place. Nothing touches the vault until you approve it in Memory → Maintenance, and any applied run can be undone from the history right there. Proposals that sit unreviewed expire after a week. You'll get a gentle nudge when something is waiting.
