# SDD 07 - MCP Capability Surface

## MCP alignment with the WordPress ecosystem

A WordPress-oriented MCP server generally exposes three kinds of capabilities:

- tools for actions
- resources for context and retrieval
- prompts for guided workflows

The BeTheme MCP server should follow that model so agents can work naturally and consistently.

## Tool surface

The server should expose tools in the following groups.

### Site and authentication

- `get_site_context`
- `get_capabilities`
- `health_check`
- `authenticate`

### Content and pages

- `list_pages`
- `get_page`
- `create_page`
- `update_page`
- `publish_page`
- `delete_page`
- `get_page_builder_payload`
- `save_page_builder_payload`

### Templates and layouts

- `list_templates`
- `get_template`
- `create_template`
- `update_template`
- `assign_template_condition`
- `get_template_options`

### Plugins and extensions

- `list_plugins`
- `install_plugin`
- `activate_plugin`
- `deactivate_plugin`
- `update_plugin`
- `configure_plugin`

### WooCommerce and commerce-related content

- `list_products`
- `create_product`
- `update_product`
- `get_shop_templates`
- `configure_checkout_or_cart_template`

### Media and assets

- `list_media`
- `upload_media`
- `attach_media`
- `delete_media`

## Resource surface

Resources should provide structured context for an agent without forcing it to discover the state through brittle scraping.

Suggested resources:

- `/site` — site identity, theme, active plugins, and capabilities
- `/pages/{id}` — page content and builder payload summary
- `/templates/{id}` — template metadata and assignment conditions
- `/plugins/{slug}` — plugin status and configuration summary
- `/woocommerce` — WooCommerce product and template context

## Prompt surface

Prompts should support high-level agent workflows such as:

- `build_homepage_from_brief`
- `create_full_site_from_template`
- `create_shop_template_and_products`
- `configure_theme_settings_for_launch`

These prompts should map to tool chains and preserve safe defaults.

## Development rule

The MCP server must be designed so an agent can complete a full website build using the MCP contract alone, without needing to use a browser-based admin workflow.
