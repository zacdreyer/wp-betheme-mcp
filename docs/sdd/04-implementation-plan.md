# SDD 04 - Implementation Plan

## Phase 1 - Foundation

- create the MCP server project structure
- define the tool contract for page and builder operations
- create the WordPress bridge plugin skeleton
- add authentication and configuration support

## Phase 2 - Core content operations

- implement tools for listing posts/pages/templates
- implement page read and update operations
- implement metadata mapping for Betheme page options
- add error handling and validation

## Phase 3 - Builder integration

- implement builder payload read/write support
- connect to the BeBuilder storage conventions used by Betheme
- add import/export support for JSON payloads
- support publish and preview flows

## Phase 4 - Safety and hardening

- add permission enforcement
- add structured logging
- add retry and conflict handling
- document migration and compatibility constraints

## Phase 5 - Release automation and versioning

- add a GitHub Actions release pipeline for packaging the MCP bridge plugin and server artifacts
- version releases using a scheme aligned to the active BeTheme version, for example `betheme-28.5.4` or `28.5.4-1`
- publish tagged releases and changelog updates automatically
- ensure release artifacts clearly identify the supported BeTheme compatibility range

## Delivery milestones

1. MVP: read/write page metadata and basic page content
2. Builder MVP: read and save a normalized builder payload
3. Release candidate: import/export, publish workflow, and end-to-end tests

## Non-functional requirements

- predictable response times for common read operations
- clear error propagation for unsupported builder structures
- backwards compatibility with the Betheme version in scope
- minimal reliance on brittle page scraping or DOM parsing
