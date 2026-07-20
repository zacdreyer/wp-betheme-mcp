# SDD 06 - Security and OWASP Alignment

## Security posture

This MCP server will be a high-privilege administrative interface for a WordPress site running BeTheme. It must therefore be designed with the same security expectations as a production-grade WordPress admin extension.

## Mandatory security controls

### Authentication

- use mutually authenticated transport such as HTTPS with client certificates or signed bearer tokens
- support short-lived access tokens with rotation
- require per-request identity and scope validation
- never rely on a single static secret for long-lived access

### Authorization

- enforce WordPress capability checks for every action
- separate roles for content editing, template editing, plugin management, and site administration
- deny by default and require explicit allow rules

### Input validation and output encoding

- validate all JSON payloads and request parameters strictly
- reject malformed builder payloads and unsupported field names
- escape all output when rendering or returning data
- prevent path traversal and file write abuse in any plugin or media operations

### OWASP-relevant protections

The implementation should explicitly address:

- OWASP A01: Broken Access Control
- OWASP A02: Cryptographic Failures
- OWASP A03: Injection
- OWASP A05: Security Misconfiguration
- OWASP A07: Identification and Authentication Failures
- OWASP A09: Security Logging and Monitoring Failures

### Additional controls

- rate limiting and abuse detection
- request signing and replay protection
- audit logging for all administrative actions
- plugin installation only from trusted sources
- checksum verification for downloaded plugins and packages
- no arbitrary PHP execution from inbound data
- sandboxing or isolated execution for risky operations such as plugin install/update

## High-risk operational rules

- the bridge plugin must not expose unrestricted admin capabilities to unauthenticated requests
- plugin installation and theme activation should require explicit administrative scope and confirmation
- destructive operations should require a second confirmation step or a dry-run mode
- all sensitive mutations should be logged with actor, target, timestamp, and action result

## Acceptance criterion

The project should not be considered production-ready unless the implementation satisfies the above controls and has passed security-focused tests.
