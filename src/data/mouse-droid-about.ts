// All copy for the /mouse-droid page, transcribed verbatim from the Mouse
// Droid app's src/views/about/content.tsx. Do not reword here — this file
// mirrors the app. Feature/guide `id`s double as markdown doc basenames in
// src/data/mouse-droid/{features,guides}/.
// (content.tsx also defines a `connections` block that the app's About page
// never renders; it is omitted here.)

export type AboutIconName =
  | 'timeline'
  | 'chat'
  | 'summary'
  | 'reports'
  | 'wellness'
  | 'brain'
  | 'eye'
  | 'ingest'
  | 'database'
  | 'cpu'
  | 'monitor'
  | 'rocket'
  | 'migrate'
  | 'palace'
  | 'shield';

export type Feature = {
  id: string;
  icon: AboutIconName;
  name: string;
  blurb: string;
};
export type PipelineStep = {
  id: string;
  icon: AboutIconName;
  title: string;
  sub: string;
};
export type Guide = {
  id: string;
  icon: AboutIconName;
  title: string;
  blurb: string;
  category: string;
  readMinutes: number;
};

// ── Hero (droid-narrated, first person) ──────────────────────────────────────
export const aboutHero = {
  name: 'Mouse Droid',
  narratedIntro:
    'Oh — hello. I watch your window titles, never your keystrokes, and quietly turn ' +
    'your workday into a timeline, a second brain, and the occasional reminder to stand up.',
  tagline: 'Your work, gently narrated.',
};

// ── The pitch ────────────────────────────────────────────────────────────────
export const aboutPitch = {
  kicker: 'What you get',
  heading: 'A few quiet signals become a second brain.',
  lead:
    "Mouse Droid samples just three things every few seconds — the app you're in, its " +
    'window title, and the time — then hands them to a capable LLM that narrates your day. ' +
    'No screen reading. No keylogging.',
  transform: {
    signals: ['app: Terminal', 'title: mouse-droid · main', 'time: 2:14pm'],
    outcome: '"Worked on Mouse Droid for 40m"',
  },
};

// ── Feature tour ─────────────────────────────────────────────────────────────
export const featureTour = {
  kicker: 'Seven ways he helps',
  heading: 'Everything Mouse Droid does',
};

export const features: Feature[] = [
  {
    id: 'timeline',
    icon: 'timeline',
    name: 'Timeline',
    blurb: 'Day & month views of your app usage, grouped into sessions and projects.',
  },
  {
    id: 'chat',
    icon: 'chat',
    name: 'Chat',
    blurb: 'An assistant grounded in your recent activity and your vault.',
  },
  {
    id: 'summary',
    icon: 'summary',
    name: 'Active summary',
    blurb: 'A rolling "here\'s what you\'re doing right now."',
  },
  {
    id: 'reports',
    icon: 'reports',
    name: 'Reports',
    blurb:
      'A daily prose recap and an exec "Top 5 Things" status — grounded in your Memory vault (project hub, session logs, related notes), with recent activity as supporting evidence.',
  },
  {
    id: 'wellness',
    icon: 'wellness',
    name: 'Wellness',
    blurb: 'Desk-time & break detection, gentle nudges, a wellness score.',
  },
  {
    id: 'brain',
    icon: 'brain',
    name: 'Second brain',
    blurb: 'Your day, narrated into Obsidian with provenance.',
  },
  {
    id: 'memory',
    icon: 'palace',
    name: 'Memory',
    blurb: 'Read your whole vault in the app — links, backlinks, graph, and search.',
  },
];

// ── How it works ─────────────────────────────────────────────────────────────
export const howItWorks = {
  kicker: 'Under the quiet',
  heading: 'From a window title to a memory',
  insightText:
    'Window titles are surprisingly rich. Your terminal puts the project dir & git branch ' +
    'there; your mail client puts the meeting subject there; your browser puts the page title there.',
  exampleLabel: 'Terminal',
  exampleTitle: 'rdwyer@mac: ~/projects/mouse-droid (main ✱)',
};

export const pipeline: PipelineStep[] = [
  { id: 'capture', icon: 'eye', title: 'Capture', sub: 'Swift helper' },
  { id: 'ingest', icon: 'ingest', title: 'Ingest', sub: 'normalize' },
  { id: 'store', icon: 'database', title: 'Store', sub: 'SQLite' },
  { id: 'brain', icon: 'cpu', title: 'Brain', sub: 'LLM + MCP' },
  { id: 'you', icon: 'monitor', title: 'You', sub: 'the app' },
];

// ── Privacy ──────────────────────────────────────────────────────────────────
export const privacy = {
  kicker: 'By design',
  heading: 'What he never sees',
  neverItems: ['No keystroke logging', 'No screenshots, ever'],
  alwaysItems: [
    'All activity stays local (SQLite)',
    'Only your LiteLLM endpoint & your Obsidian vault',
    'Connections opt-in, read-only by default (Jira issues, Google Calendar meetings — off by default; Jira writes need per-action approval)',
  ],
  captureDepth: 'app name · window title · URL · timing · idle (on/off)',
};

// ── Guides ───────────────────────────────────────────────────────────────────
export const guidesSection = {
  kicker: 'Go deeper',
  heading: 'Guides & walkthroughs',
  lead: 'Longer, targeted how-tos. Open one and it reads in a focused pane over the page.',
};

export const guides: Guide[] = [
  {
    id: 'getting-started',
    icon: 'rocket',
    title: 'Getting Started',
    blurb: 'From first launch to your first narrated day.',
    category: 'Setup',
    readMinutes: 8,
  },
  {
    id: 'migrating',
    icon: 'migrate',
    title: 'Migrating existing notes',
    blurb: 'Bring an existing project & notes into Mouse Droid cleanly.',
    category: 'Workflow',
    readMinutes: 12,
  },
  {
    id: 'memory-palace',
    icon: 'palace',
    title: 'Mastering the Memory Palace',
    blurb: 'Get the most out of recall, hubs, and provenance.',
    category: 'Power user',
    readMinutes: 15,
  },
];
