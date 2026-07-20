# TDD 01 - Test Strategy

## Testing philosophy

The implementation should be driven by behavior-focused tests that reflect how an agent will use the MCP server. The tests should validate user-visible contract behavior rather than internal implementation details.

## Test levels

### Unit tests

Cover the following:

- request validation
- metadata mapping
- payload normalization
- permission checks

### Integration tests

Run against a local WordPress environment with BeTheme installed. Cover:

- reading a page with BeBuilder data
- updating metadata fields
- importing builder payloads
- publishing a draft page

### Contract tests

Ensure the MCP tools return stable schemas for:

- page inspection
- page update
- template read
- builder payload export/import

## Test data strategy

Use a fixture site or local disposable WordPress installation with:

- BeTheme active
- at least one page using BeBuilder
- one template and one portfolio item
- sample media attachments

## TDD workflow

1. write a failing test for a new capability
2. implement the smallest change that satisfies it
3. refactor only after the test passes
4. keep tests scoped to the MCP contract and WordPress integration boundary
