# CLAUDE.md

## Project summary

This repository contains the implementation scaffold for a secure MCP server and WordPress bridge for managing BeTheme-powered sites.

## Build and test

- Install dependencies with `npm install`
- Run tests with `npm test`
- The initial server implementation lives in `src/server.js`
- The WordPress bridge plugin scaffold lives in `plugin/betheme-mcp-bridge.php`
- The release workflow lives in `.github/workflows/release.yml`

## Development priorities

1. Keep the MCP server compatible with the documented tool/resource/prompt surface.
2. Preserve security-first design and least-privilege access.
3. Keep versioning aligned with the BeTheme release being targeted.
4. Ensure every new feature has a corresponding test.

## Working conventions

- Prefer small, verifiable changes.
- Update documentation when the implementation changes.
- Keep the repository self-contained and easy for another agent to continue from.
