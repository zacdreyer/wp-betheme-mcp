# SDD 02 - Architecture

## Architectural approach

The MCP server should be implemented as a separate service that talks to WordPress over a small bridge layer. This avoids embedding Betheme-specific logic inside the MCP protocol layer and keeps the integration maintainable.

## High-level components

### 1. MCP server

The MCP server exposes tools and resources that an agent can call. It should:

- define a stable tool contract for page and builder operations
- validate input and translate it to WordPress-friendly requests
- return normalized responses for agents

### 2. WordPress bridge plugin

A lightweight WordPress plugin should be installed on the target site. It acts as the compatibility layer between the MCP server and Betheme.

Responsibilities:

- expose authenticated REST endpoints
- bridge MCP requests to Betheme-specific data structures
- read and write post meta such as `mfn-page-items` and theme-specific page options
- support builder import/export and publish actions

### 3. Betheme integration layer

This layer understands the Betheme-specific conventions found in:

- [research/betheme/functions.php](research/betheme/functions.php)
- [research/betheme/functions/builder/class-mfn-builder-ajax.php](research/betheme/functions/builder/class-mfn-builder-ajax.php)
- [research/betheme/visual-builder/visual-builder.php](research/betheme/visual-builder/visual-builder.php)
- [research/betheme/functions/post-types/class-mfn-post-type-page.php](research/betheme/functions/post-types/class-mfn-post-type-page.php)

It should normalize operations into the following conceptual domains:

- page metadata
- builder payloads
- templates and layouts
- media references

## Data flow

1. An agent issues an MCP tool call.
2. The MCP server validates the request and routes it to the bridge plugin.
3. The bridge plugin calls WordPress APIs or Betheme-specific hooks.
4. The result is normalized into a JSON response.
5. The agent receives the result without needing to understand the Betheme internals.

## Recommended implementation stack

- MCP runtime: TypeScript or Python SDK
- Bridge plugin: PHP WordPress plugin
- Transport: HTTPS with authentication
- Storage: WordPress database and post meta
- Payload format: JSON for tool inputs and outputs

## Security model

- authentication via WordPress application passwords, JWT, or signed tokens
- role-based access checks aligned with WordPress capabilities
- no direct execution of admin-only actions without explicit permissions
- nonce-aware handling for Betheme's AJAX-based builder flows

## Operational notes

- the MCP server should avoid assuming a single Betheme version
- builder payload compatibility should be versioned
- failed operations should return structured errors with enough detail for debugging
- release artifacts should be versioned in a way that reflects the supported BeTheme release, so admins can quickly identify compatibility
