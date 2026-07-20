# TDD 02 - Test Cases

## Core tool tests

### list_pages

- should return pages from the target WordPress site
- should include BeTheme-specific metadata when present
- should filter by post type when requested

### get_page

- should return a page with standard WordPress fields
- should include builder payload summary when available
- should return metadata fields mapped to the BeTheme model

### update_page_metadata

- should update a supported field such as `mfn-post-layout`
- should reject unsupported fields with a clear error
- should preserve unrelated metadata

### save_builder_payload

- should accept a normalized payload and persist it
- should fail cleanly if the payload structure is invalid
- should not overwrite unrelated content fields

### import_builder_payload

- should import a JSON payload into a target page
- should preserve the original page ID and status
- should return the imported payload summary

### publish_page

- should publish a draft page without losing builder data
- should return the new published state

## Edge cases

- unsupported post type
- missing permissions
- invalid JSON payload
- malformed builder structure
- media reference pointing to a missing attachment
