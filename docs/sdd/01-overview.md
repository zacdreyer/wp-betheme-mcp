# SDD 01 - Product Overview

## Purpose

The BeTheme MCP server will expose a structured tool interface for AI agents to work with Betheme-powered WordPress sites. The server is designed for agents that need to create, inspect, edit, and publish pages built with BeBuilder while still using WordPress as the underlying CMS.

## Problem statement

Betheme is not a standard block-first theme. It installs its own builder stack and uses custom post metadata to define page layout, content, and rendering behavior. The theme bootstraps that stack in [research/betheme/functions.php](research/betheme/functions.php) and exposes the builder through [research/betheme/functions/builder/class-mfn-builder-ajax.php](research/betheme/functions/builder/class-mfn-builder-ajax.php).

A generic WordPress MCP server cannot reliably operate on this content model because:

- builder content is not represented as ordinary post content only
- significant state lives in custom meta fields
- BeBuilder uses its own editor lifecycle and AJAX actions
- page templates and layout controls are theme-specific

## Solution summary

The BeTheme MCP server will provide a bridge between an agent and a WordPress installation running BeTheme. The server will:

- expose a normalized MCP tool set
- communicate with WordPress through REST and admin-safe endpoints
- translate between Betheme’s builder model and a simpler agent-friendly representation
- preserve security and permission boundaries

## In scope

- reading pages, posts, portfolios, templates, and products
- retrieving and updating BeTheme page metadata
- reading and modifying BeBuilder payloads through a bridge layer
- creating and publishing draft content
- importing and exporting builder content
- handling media attachment references

## Out of scope

- full visual WYSIWYG editing in the MCP layer
- theme styling authoring beyond configuration and metadata
- plugin installation or server administration
- replacing the WordPress admin experience

## Success criteria

The project will be considered successful when an agent can:

1. inspect a BeTheme page and report its builder structure and metadata
2. update a page layout setting such as sidebar or full-width mode
3. create a new page and assign a builder payload to it
4. publish or schedule the page safely
5. import/export builder content between sites without data loss
