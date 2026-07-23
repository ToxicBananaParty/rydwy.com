Already have a project underway and a pile of notes? Here's how to fold them in so Mouse
Droid picks up where you left off, without a mess.

### Create the project so the droid can recognize it

Mouse Droid figures out which project you're working on by reading your window titles and
matching them against your **active projects** — and those project names come from your
vault. So the first step is making sure the project exists there.

A small classifier looks at each activity (the app, the window title, the page host) and
asks *"which of these known projects does this belong to?"* It caches its answer per
app-and-title combination, so once it has placed, say, your editor on the billing project,
it doesn't have to think about it again. The upshot: name the project the way it shows up
in your work — terminals and editors usually surface the repo directory — so the matching
lands naturally.

You can give any project an optional **description** — a short note covering the apps,
sites, and topics that belong to it. The classifier uses this to sharpen its matching
(especially for short or codename-y project names that don't appear in window titles),
and it also feeds into summaries, reports, and chat context. Two ways to set one: open
the **Reports** tab, find the project's pill, and tap the **✎** beside it; or open the
project's hub note (`07_projects/<project>/_index.md`) in Obsidian and write a plain
paragraph right after the title — Mouse Droid reads that intro paragraph as the
description automatically.

### Bring old notes in as vault notes

Drop your existing notes into your Obsidian vault under the project's folder
(`07_projects/<project>/`). The Memory service indexes whatever's there, so **recall**
starts surfacing your old material right alongside freshly narrated activity — no special
import step required.

### Let the hub fill in

Each project has a **hub** note (`07_projects/<project>/_index.md`) that ties its sessions
and notes together. If you turn on hub enrichment in Settings, Mouse Droid keeps a rolling
summary section there fresh as sessions close. It's not instant — it updates at the end of
work sessions and is rate-limited so it won't churn — so give it a day or two of real
activity and the hub fills itself in. You don't need to hand-curate everything up front.
