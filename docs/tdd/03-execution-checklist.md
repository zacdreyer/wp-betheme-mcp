# TDD 03 - Execution Checklist

## Setup

- create a local WordPress environment with BeTheme installed
- install the bridge plugin under test
- configure MCP authentication credentials
- ensure a test page with builder content exists

## Verification steps

1. run unit tests for validation and mapping logic
2. run integration tests against the local WordPress site
3. verify MCP tool responses match the documented schema
4. confirm permission failures return structured errors
5. verify import/export round trips preserve builder payloads

## Definition of done

- all core tests pass
- failure scenarios return clear messages
- metadata and builder payload changes are persisted correctly
- documentation remains aligned with the implemented contract
