# BeTheme MCP Server Documentation

This directory contains the software design documentation (SDD) and test-driven development (TDD) guidance for the BeTheme MCP server project.

## Why this project exists

The native WordPress MCP integration is not sufficient for BeTheme because the theme uses its own BeBuilder experience instead of relying on standard WordPress editor content alone. The theme bootstraps a dedicated builder stack in [research/betheme/functions.php](research/betheme/functions.php), exposes builder AJAX actions in [research/betheme/functions/builder/class-mfn-builder-ajax.php](research/betheme/functions/builder/class-mfn-builder-ajax.php), and launches the visual builder through [research/betheme/visual-builder/visual-builder.php](research/betheme/visual-builder/visual-builder.php).

The MCP server must therefore act as a full backend operating layer for the WordPress + BeTheme ecosystem, not as a simple content wrapper.

## Scope covered by this documentation

This documentation is written to support the requirement that an agent can:

- build and edit pages in BeBuilder
- build and configure templates for headers, footers, archives, product pages, and other BeTheme layouts
- install, activate, update, and configure plugins, including WooCommerce and other ecosystem plugins
- operate the site as if it were logged into the WordPress backend, while remaining fully authenticated, auditable, and secure

## Documentation map

- SDD
  - [docs/sdd/01-overview.md](docs/sdd/01-overview.md)
  - [docs/sdd/02-architecture.md](docs/sdd/02-architecture.md)
  - [docs/sdd/03-data-model-and-workflows.md](docs/sdd/03-data-model-and-workflows.md)
  - [docs/sdd/04-implementation-plan.md](docs/sdd/04-implementation-plan.md)
  - [docs/sdd/05-requirements-coverage.md](docs/sdd/05-requirements-coverage.md)
  - [docs/sdd/06-security-and-owasp.md](docs/sdd/06-security-and-owasp.md)
  - [docs/sdd/07-mcp-capability-surface.md](docs/sdd/07-mcp-capability-surface.md)
- TDD
  - [docs/tdd/01-test-strategy.md](docs/tdd/01-test-strategy.md)
  - [docs/tdd/02-test-cases.md](docs/tdd/02-test-cases.md)
  - [docs/tdd/03-execution-checklist.md](docs/tdd/03-execution-checklist.md)

## Project goals

1. Let an agent inspect, create, edit, and publish BeTheme pages and templates safely.
2. Support BeBuilder payloads without depending on generic WordPress block semantics.
3. Provide a predictable MCP tool surface for page creation, template authoring, plugin lifecycle management, publishing workflows, and site-level administration.
4. Keep the implementation compatible with the Betheme architecture and secure enough for a high-risk administrative surface.

## Development readiness note

The documentation is now structured to support implementation of a full MCP-based operating layer for WordPress + BeTheme. The remaining requirement is to turn this specification into the actual server, bridge plugin, and security controls in code.
