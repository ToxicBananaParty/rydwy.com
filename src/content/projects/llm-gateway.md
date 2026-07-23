---
title: Multi-Site LLM Gateway
anchor: llm-gateway
order: 2
tools:
  [
    Kubernetes,
    Helm,
    LiteLLM,
    CloudNativePG,
    PostgreSQL,
    Terraform,
    GitLab CI,
    Prometheus,
    Locust,
  ]
# Screenshots to come — add censored captures like:
# images:
#   - src: ../../assets/llmgateway-grafana.png
#     alt: LLM gateway Grafana dashboard
---
ILM's engineers reach Gemini, Claude, and self-hosted vLLM models — nearly
thirty model routes — through a single OpenAI-compatible gateway built on
[LiteLLM](https://www.litellm.ai/), deployed site-by-site to Kubernetes
clusters in multiple regions. Each site runs its own autoscaled,
highly available stack behind TLS ingress tuned for long-lived LLM streaming:
hour-long timeouts, unbuffered responses, automatic upstream retries.

I led the platform's re-architecture from a single-image monolith into
independently scaled gateway, backend, and UI services with schema migrations
as a pre-upgrade hook, and moved its production database onto a two-instance
[CloudNativePG](https://cloudnative-pg.io/) Postgres cluster with read/write
splitting — a zero-data-loss cutover guarded by a CI gate that refuses to
snapshot against a live writer. Deployments fan out per site from a GitLab CI
matrix, Terraform provisions the cloud IAM, Prometheus scrapes every
component, the Helm charts carry their own unit-test suite, and service
account tokens stay unmounted from every pod so a prompt-injected workload
can't reach the cluster API.

I also built the platform's [Locust](https://locust.io/) load-testing suite,
engineered to reproduce production failure modes — connection resets on
100k-token streaming conversations, database connection-pool exhaustion —
before users find them.
