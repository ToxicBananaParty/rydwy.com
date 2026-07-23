---
title: LLM Dashboard
anchor: llm-dashboard
order: 3
tools:
  [Python, FastAPI, React, TypeScript, Redis, Kubernetes, Docker, Okta OIDC]
# Screenshots to come — add censored captures like:
# images:
#   - src: ../../assets/llmdashboard-metrics.png
#     alt: LLM Dashboard admin metrics view
---
The self-service front door to the [multi-site LLM gateway](#llm-gateway):
engineers request access, mint their own API keys, and watch spend against
budgets, while admins get org-wide analytics — spend by team, tag, user, and
agent, daily-active-user trends — plus approval queues for access requests,
budget increases, and shared team apps with recurring budgets. Nobody handles
admin credentials directly; the dashboard wraps the gateway's admin API in a
governance layer.

A [FastAPI](https://fastapi.tiangolo.com/) backend (~10k lines of Python)
does the heavy lifting — thread-pooled parallel pagination of spend logs
behind a per-day Redis cache, tiered budget workflows, and chat and email
notifications on every decision — while sign-in is pure SSO: OAuth2-Proxy and
Okta OIDC in front, server-side admin re-checks behind. The React/TypeScript
frontend and backend ship as separate images to Kubernetes via Helm, and a
one-click release train bumps versions, generates the changelog from
merge-request footers, tags, deploys, and announces the release — 50 releases
and counting.
