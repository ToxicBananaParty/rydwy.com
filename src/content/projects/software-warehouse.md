---
title: Software Warehouse API & Dashboard
anchor: software-warehouse
order: 4
tools: [Docker, Kubernetes, ScyllaDB, GraphQL, Rust, TypeScript, React, Python]
images:
  - src: ../../assets/softserve-releases.png
    alt: SoftServe dashboard listing software releases
  - src: ../../assets/softserve-release.png
    alt: SoftServe release detail view
---
ILM retains a massive internal library of software. The releasing and
distribution of this software library is tracked via a global database built
on ScyllaDB and Bevy. I helped lead development on SoftServe, the user-facing
portion of the software warehouse — an API built on GraphQL and a web
dashboard powered by React.

As part of this project, I also helped maintain and improve the CI/CD for the
software warehouse, and oversaw the migration of large parts of the warehouse
codebase from Python to Rust.
