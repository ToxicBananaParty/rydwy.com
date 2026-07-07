---
title: Status Monitor
anchor: status-monitor
order: 7
tools: [TypeScript, Prometheus, Grafana]
images:
  - src: ../../assets/statusmonitor.png
    alt: Status Monitor Grafana uptime dashboard
  - src: ../../assets/colonelroy.png
    alt: Status Monitor Slack alerting bot
---
Status Monitor is a Node.js app written in TypeScript that allows an extremely
wide range of connectability: any applet, software, hardware, or device that
can communicate externally via LAN (regardless of method) can have its uptime
monitored on a custom [Grafana](https://grafana.com/) page via
[Prometheus](https://prometheus.io/). It also runs a Slack bot and SMS/SMTP
alerting service that, when in show mode, sends out alerts when any connected
clients go down.
