---
title: Unreal Engine Event Bus
anchor: unreal-event-bus
order: 2
tools: [Unreal Engine, AWS, InfluxDB, Grafana, C++, TypeScript]
---
Unreal Engine, via a plugin developed in C++, provides an API of methods to be
called from either code or visual scripting. This API allows any data desired
by the game developers (hardware info, performance metrics, progression data,
etc.) to be tracked; a serverless microservice backend (API Gateway, Lambda,
S3, Kinesis) submits the metrics and events to
[InfluxDB](https://www.influxdata.com/), which is then visualized in
[Grafana](https://grafana.com/).

I can't say much more or show the plugin in action in the interest of
respecting confidentiality — it is very powerful and extremely useful in all
phases of development: troubleshooting during development cycles, QA during
hardening cycles, and marketing and analytics post-release.
