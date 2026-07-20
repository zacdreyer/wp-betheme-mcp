# AGENTS.md

## Mission

Continue building the BeTheme MCP server and bridge plugin in a way that is safe, testable, and compatible with the documented architecture.

## Repository map

- `src/server.js` — MCP server implementation
- `src/bridge.js` — HTTP bridge client used by the MCP server
- `plugin/betheme-mcp-bridge.php` — WordPress plugin bridge scaffold
- `docs/` — SDD and TDD documentation
- `.github/workflows/release.yml` — GitHub release workflow

## Rules for agents

- Follow the documented requirements in `docs/`.
- Keep security first: authenticate, authorize, validate, and audit changes.
- Do not assume browser-based admin workflows; the server should provide backend-equivalent control through MCP.
- Prefer implementation that works with real WordPress + BeTheme environments, not just mocks.
- Update `docs/agents-memory.md` whenever the project state changes.
