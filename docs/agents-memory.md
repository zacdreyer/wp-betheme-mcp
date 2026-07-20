# Agents Memory

## Status

- Repository initialized with a Node-based MCP server scaffold.
- A WordPress bridge plugin scaffold exists in `plugin/betheme-mcp-bridge.php`.
- A GitHub release workflow exists in `.github/workflows/release.yml`.
- Documentation for architecture, requirements, security, and testing exists in `docs/`.

## Current implementation state

- MCP server exposes a complete tool manifest for page, template, and plugin operations.
- The server supports initialization, tool listing, tool invocation, and newline-delimited stdio transport handling.
- The plugin bridge now exposes REST routes for health, site context, capabilities, pages, templates, plugins, and plugin installation.
- Bridge requests now honor environment-based configuration and timeouts, and the local test suite passes.

## Next priorities

1. Add support for more BeTheme-specific operations such as page metadata, template assignment, and builder payload handling.
2. Harden authentication and authorization for the WordPress bridge.
3. Add integration tests against a local WordPress + BeTheme environment.
4. Improve the release workflow to version artifacts against the active BeTheme release.

## Working notes

- BeTheme version reference currently tracked as 28.5.4 in the project scaffolding.
- The MCP server should stay aligned with the documented tool/resource/prompt model.
- Any future agent should continue from this file and update it after major changes.
