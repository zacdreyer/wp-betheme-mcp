# BeTheme MCP Server

A secure, agent-friendly MCP server designed to operate a WordPress site running BeTheme as a full backend-equivalent environment.

```text
┌──────────────────────────────────────────────────────────────┐
│  BeTheme MCP Server                                       │
│  Agent-driven WordPress + BeTheme administration           │
│  Pages • Templates • Plugins • WooCommerce • BeBuilder     │
└──────────────────────────────────────────────────────────────┘
```

## What this project does

This project aims to let an AI agent manage a BeTheme-powered WordPress site without needing to log in through a browser. The MCP layer is intended to support:

- building and editing pages in BeBuilder
- creating and configuring templates for headers, footers, archives, product pages, and other BeTheme layouts
- installing, activating, updating, and configuring plugins
- working with WooCommerce and related ecosystem plugins
- handling site administration in a secure, auditable, and capability-aware way

## Why this matters

The native WordPress MCP experience is not sufficient for BeTheme because BeTheme uses its own builder architecture and custom page/template model. This project bridges that gap so an agent can work with the site in a way that feels close to working directly in the WordPress backend.

## Documentation

The project documentation is organized under the docs folder:

- [docs/README.md](docs/README.md) — documentation index
- [docs/sdd/01-overview.md](docs/sdd/01-overview.md) — product overview
- [docs/sdd/02-architecture.md](docs/sdd/02-architecture.md) — system architecture
- [docs/sdd/03-data-model-and-workflows.md](docs/sdd/03-data-model-and-workflows.md) — data model and workflows
- [docs/sdd/04-implementation-plan.md](docs/sdd/04-implementation-plan.md) — implementation plan
- [docs/sdd/05-requirements-coverage.md](docs/sdd/05-requirements-coverage.md) — requirement mapping
- [docs/sdd/06-security-and-owasp.md](docs/sdd/06-security-and-owasp.md) — security posture
- [docs/sdd/07-mcp-capability-surface.md](docs/sdd/07-mcp-capability-surface.md) — MCP tools, resources, and prompts
- [docs/tdd/01-test-strategy.md](docs/tdd/01-test-strategy.md) — testing strategy
- [docs/tdd/02-test-cases.md](docs/tdd/02-test-cases.md) — test cases
- [docs/tdd/03-execution-checklist.md](docs/tdd/03-execution-checklist.md) — execution checklist

## Security first

This project is intended for high-risk administrative use. The design explicitly calls for:

- strong authentication and authorization
- least-privilege access
- audit logging
- input validation and payload hardening
- OWASP-aligned security controls

## Repository focus

This repository currently contains the project documentation and the BeTheme research context needed to guide implementation. The next step is to turn that specification into the actual MCP server and bridge components.

## Release and versioning

The project should ship through GitHub releases with versioning aligned to the BeTheme version it targets. This ensures that site operators can clearly match the MCP plugin package to the BeTheme release they are using.

## Status

Status: specification and documentation complete; implementation in progress.
