# SDD 05 - Requirements Coverage

## Requirement mapping

This section maps the documentation to the core business requirements you described.

### 1. Build and edit pages

The MCP server must support full page authoring workflows for BeTheme pages, including:

- creating pages
- editing existing pages
- managing BeBuilder content
- updating page metadata and layout options
- publishing, drafting, and previewing pages

This is covered by the page model and workflows in [docs/sdd/03-data-model-and-workflows.md](docs/sdd/03-data-model-and-workflows.md).

### 2. Build and configure templates

The MCP server must support templates as first-class entities, including:

- header templates
- footer templates
- archive templates
- product and shop templates
- page templates used by BeTheme

This is covered by the template entity model in [docs/sdd/03-data-model-and-workflows.md](docs/sdd/03-data-model-and-workflows.md) and the Betheme template-related architecture in [research/betheme/functions.php](research/betheme/functions.php).

### 3. Install plugins

The MCP server must allow plugin lifecycle management, including:

- listing available plugins
- installing plugins
- activating or deactivating plugins
- updating plugins
- configuring plugin settings where supported

This is explicitly included in the scope and implementation plan in [docs/README.md](docs/README.md) and [docs/sdd/04-implementation-plan.md](docs/sdd/04-implementation-plan.md).

### 4. Full backend-equivalent control over WordPress and BeTheme

The MCP server is intended to provide backend-equivalent control without requiring a browser login. The architecture therefore assumes:

- a bridge plugin running inside WordPress
- authenticated remote tool calls
- capability checks aligned with WordPress roles and capabilities
- support for theme, plugin, page, template, and media operations

This is described in [docs/sdd/02-architecture.md](docs/sdd/02-architecture.md).

### 5. Security and hardening

Because this is a high-risk administrative surface, the documentation explicitly treats security as a primary requirement. This includes authentication, authorization, least privilege, auditability, rate limiting, input validation, and supply-chain protections.

This is covered in [docs/sdd/06-security-and-owasp.md](docs/sdd/06-security-and-owasp.md).
