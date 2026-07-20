# SDD 03 - Data Model and Core Workflows

## Core entities

### Page

Represents a WordPress page that may or may not use BeBuilder.

Required fields:

- id
- title
- slug
- status
- postType
- content
- builderPayload
- metadata

### Template

Represents a BeTheme template used for headers, footers, or page structures.

Required fields:

- id
- title
- type
- builderPayload
- metadata

### Builder payload

A normalized representation of the BeBuilder structure.

Suggested shape:

```json
{
  "version": 1,
  "sections": [
    {
      "id": "sec-001",
      "type": "section",
      "items": []
    }
  ],
  "meta": {}
}
```

## Betheme-specific metadata

The implementation must account for fields already used by Betheme, including:

- `mfn-page-items` for the builder state
- `mfn_template_type` for template classification
- `mfn-post-layout`
- `mfn-post-sidebar`
- `mfn-post-hide-content`
- `mfn-post-hide-title`
- `mfn-post-full-width`

These come from the page options model in [research/betheme/functions/post-types/class-mfn-post-type-page.php](research/betheme/functions/post-types/class-mfn-post-type-page.php).

## Core workflows

### 1. Read page

The agent should be able to retrieve:

- standard WordPress fields
- Betheme metadata
- builder payload summary
- related template settings

### 2. Update page metadata

The agent should be able to change layout and presentation settings such as:

- full width mode
- sidebar selection
- hide title or content
- custom header/footer template

### 3. Edit builder content

The agent should be able to:

- load a normalized builder representation
- add, update, or remove sections or items
- save the data back to the relevant post meta field

### 4. Import and export

The system should support JSON-based import/export so content can be moved between environments.

### 5. Publish workflow

The server must support draft, preview, and publish actions while preserving the builder payload.

## Normalization rules

- WordPress content remains the canonical text body where applicable
- builder content is stored separately and must not be overwritten by ordinary content edits
- metadata should be updated only when the field is explicitly supported
- unsupported builder structures should fail gracefully with a descriptive error
