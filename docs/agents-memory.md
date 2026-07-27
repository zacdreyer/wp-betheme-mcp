# Agents Memory

## Status

- Repository initialized with a Node-based MCP server scaffold.
- A WordPress bridge plugin scaffold exists in `plugin/betheme-mcp-bridge.php`.
- A GitHub release workflow exists in `.github/workflows/release.yml`.
- Documentation for architecture, requirements, security, and testing exists in `docs/`.

## Current implementation state

- MCP server exposes a complete tool manifest for page, template, and plugin operations.
- The server validates every tool call against the declared JSON schema and masks internal error details.
- The server supports initialization, tool listing, tool invocation, newline-delimited stdio transport handling, and MCP resources/prompts retrieval.
- The bridge client signs every request with HMAC-SHA256 and a timestamp to prevent replay attacks.
- The plugin bridge enforces per-route WordPress capability checks (pages, templates, plugin install/activate) and sanitizes all input.
- Only allow-listed BeTheme meta keys are accepted; builder payloads are stored in BeTheme's native format.
- Every administrative action is logged through the `betheme_mcp_audit` hook.
- Rate limiting is enforced per API key using a WordPress transient bucket.
- Builder payload writes are capped to a maximum JSON size to prevent abuse.
- Multi-site support is implemented: the local MCP server can manage many WordPress sites via a `sites.json` file or `BETHEME_MCP_SITES` env var, and tools accept an optional `site` argument.
- A `list_sites` tool exposes configured sites (without credentials) so the agent can target the correct site.
- The release workflow runs PHP lint and can include docs/examples in release archives.
- The local Node test suite, Node lint, and PHP syntax check pass (`npm test && npm run lint && php -l`).

## Next priorities

1. Add integration tests against a real local WordPress + BeTheme environment.
2. Add automated dependency vulnerability scanning to the release workflow.
3. Add artifact signing/checksums to GitHub releases.
4. Expand the MCP surface to include WooCommerce and media operations once the core bridge is proven in production.

## Working notes

- BeTheme version reference currently tracked as 28.5.4 in the project scaffolding.
- The MCP server should stay aligned with the documented tool/resource/prompt model.
- Any future agent should continue from this file and update it after major changes.
