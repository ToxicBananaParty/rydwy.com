---
title: Mouse Droid
anchor: mouse-droid
order: 1
tools: [Rust, Tauri, Swift, TypeScript, React, SQLite, MCP]
link:
  label: Explore the app's About page
  href: https://rydwy.com/mouse-droid
# Screenshots to come — add censored captures like:
# images:
#   - src: ../../assets/mousedroid-timeline.png
#     alt: Mouse Droid timeline view
---
Mouse Droid is a macOS menu-bar companion that watches a deliberately minimal
signal — frontmost app, window title, and timing; never keystrokes, never
screenshots — and has an LLM narrate the workday from it: a project-grouped
timeline, a searchable second brain in [Obsidian](https://obsidian.md/),
grounded chat, one-click status reports, and wellness nudges, all voiced by a
fretful protocol droid.

Under the hood it's a [Tauri](https://tauri.app/) app: a ten-crate Rust
workspace (~55k lines) runs capture, the agent loop, and integrations; a Swift
sidecar reads the macOS Accessibility API; and a React/TypeScript frontend
renders it all. Chat is a hand-built two-phase ReAct agent — streaming tokens,
live tool calls — backed by a custom hybrid-RAG memory service that fuses
SQLite full-text and vector search via reciprocal rank fusion and exposes
~36 tools over [MCP](https://modelcontextprotocol.io/). TypeScript IPC
bindings are generated from the Rust types and drift-guarded in CI, and
roughly 1,500 tests across Rust, TypeScript, and Swift run fully offline
against mocked LLM and OS layers.

Opt-in Jira and Google Calendar/Docs integrations degrade gracefully behind
circuit breakers, and anything the LLM drafts — tickets extracted from
meeting notes, edits to the vault — lands in a human approval tray before it
touches an external system.
