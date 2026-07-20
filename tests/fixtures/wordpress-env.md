# Local WordPress integration plan

This fixture documents the expected local WordPress environment for future integration tests:

- WordPress core installed locally
- BeTheme active
- plugin bridge file copied into `wp-content/plugins/betheme-mcp-bridge/`
- `BETHEME_MCP_API_KEY` defined in `wp-config.php`
- a test page and template seeded for end-to-end CRUD validation
