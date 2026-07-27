import { pathToFileURL } from 'node:url';
import { loadConfig, resolveSite, warnIfInsecure } from './config.js';
import { createBridgeClientForSite } from './bridge.js';
import { createAuditLogger, sanitizeToolArgs } from './security.js';

function withSiteProperty(inputSchema) {
  return {
    ...inputSchema,
    properties: {
      ...(inputSchema.properties || {}),
      site: { type: 'string', description: 'Optional site alias when managing multiple sites.' }
    }
  };
}

export function createToolManifest() {
  return [
    {
      name: 'health_check',
      description: 'Verify that the MCP bridge and WordPress site are reachable.',
      inputSchema: withSiteProperty({ type: 'object', properties: {} })
    },
    {
      name: 'authenticate',
      description: 'Verify bridge credentials and return site capabilities.',
      inputSchema: withSiteProperty({ type: 'object', properties: {} })
    },
    {
      name: 'list_sites',
      description: 'List the WordPress sites configured for this MCP server.',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'get_site_context',
      description: 'Return a safe summary of the WordPress site and theme context for an agent.',
      inputSchema: withSiteProperty({ type: 'object', properties: {} })
    },
    {
      name: 'get_capabilities',
      description: 'Return the capabilities exposed by the bridge and the current authentication context.',
      inputSchema: withSiteProperty({ type: 'object', properties: {} })
    },
    {
      name: 'list_pages',
      description: 'List pages available in WordPress.',
      inputSchema: withSiteProperty({ type: 'object', properties: { status: { type: 'string' } } })
    },
    {
      name: 'get_page',
      description: 'Retrieve a specific WordPress page.',
      inputSchema: withSiteProperty({
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      })
    },
    {
      name: 'create_page',
      description: 'Create a new page in WordPress.',
      inputSchema: withSiteProperty({
        type: 'object',
        properties: {
          title: { type: 'string' },
          slug: { type: 'string' },
          content: { type: 'string' },
          builder_payload: {},
          meta: { type: 'object' }
        },
        required: ['title']
      })
    },
    {
      name: 'update_page',
      description: 'Update an existing WordPress page.',
      inputSchema: withSiteProperty({
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          content: { type: 'string' },
          builder_payload: {},
          meta: { type: 'object' }
        },
        required: ['id']
      })
    },
    {
      name: 'publish_page',
      description: 'Publish a draft page.',
      inputSchema: withSiteProperty({
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      })
    },
    {
      name: 'delete_page',
      description: 'Delete a WordPress page.',
      inputSchema: withSiteProperty({
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      })
    },
    {
      name: 'get_page_builder_payload',
      description: 'Retrieve the stored BeBuilder payload for a page.',
      inputSchema: withSiteProperty({
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      })
    },
    {
      name: 'save_page_builder_payload',
      description: 'Persist a BeBuilder payload for a page.',
      inputSchema: withSiteProperty({
        type: 'object',
        properties: {
          id: { type: 'integer' },
          builder_payload: {}
        },
        required: ['id', 'builder_payload']
      })
    },
    {
      name: 'list_templates',
      description: 'List available BeTheme templates.',
      inputSchema: withSiteProperty({ type: 'object', properties: {} })
    },
    {
      name: 'get_template',
      description: 'Retrieve a specific BeTheme template.',
      inputSchema: withSiteProperty({
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      })
    },
    {
      name: 'create_template',
      description: 'Create a new BeTheme template.',
      inputSchema: withSiteProperty({
        type: 'object',
        properties: {
          title: { type: 'string' },
          type: { type: 'string' },
          content: { type: 'string' },
          builder_payload: {},
          meta: { type: 'object' }
        },
        required: ['title', 'type']
      })
    },
    {
      name: 'update_template',
      description: 'Update an existing BeTheme template.',
      inputSchema: withSiteProperty({
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          type: { type: 'string' },
          content: { type: 'string' },
          builder_payload: {},
          meta: { type: 'object' }
        },
        required: ['id']
      })
    },
    {
      name: 'list_plugins',
      description: 'List installed or available plugins.',
      inputSchema: withSiteProperty({ type: 'object', properties: {} })
    },
    {
      name: 'install_plugin',
      description: 'Install and activate a plugin from the WordPress ecosystem.',
      inputSchema: withSiteProperty({
        type: 'object',
        properties: {
          slug: { type: 'string' }
        },
        required: ['slug']
      })
    },
    {
      name: 'activate_plugin',
      description: 'Activate an installed plugin.',
      inputSchema: withSiteProperty({
        type: 'object',
        properties: {
          slug: { type: 'string' }
        },
        required: ['slug']
      })
    },
    {
      name: 'deactivate_plugin',
      description: 'Deactivate an installed plugin.',
      inputSchema: withSiteProperty({
        type: 'object',
        properties: {
          slug: { type: 'string' }
        },
        required: ['slug']
      })
    }
  ];
}

export function createMcpServer({ bridge = null, bridgeFactory = null, sites = [], auditLogger = createAuditLogger() } = {}) {
  const manifest = createToolManifest();

  async function resolveBridge(siteName) {
    if (bridge) return bridge;
    if (bridgeFactory) return bridgeFactory(siteName);
    return null;
  }

  return {
    listTools() {
      return manifest;
    },

    async callTool(name, args = {}) {
      const safeArgs = sanitizeToolArgs(name, args, manifest);
      const siteName = safeArgs.site;
      const toolArgs = { ...safeArgs };
      delete toolArgs.site;

      auditLogger.log({ action: 'tool_call', tool: name, args: safeArgs, site: siteName });

      if (name === 'list_sites') {
        return sites.map((site) => ({ name: site.name, baseUrl: site.baseUrl }));
      }

      const toolBridge = await resolveBridge(siteName);
      if (!toolBridge) {
        throw new Error('Bridge authentication is required');
      }

      switch (name) {
        case 'health_check':
          return toolBridge.request('/betheme-mcp/v1/health');
        case 'authenticate':
          return this.authenticate(toolArgs, siteName);
        case 'get_site_context':
          return toolBridge.request('/betheme-mcp/v1/site');
        case 'get_capabilities':
          return toolBridge.request('/betheme-mcp/v1/capabilities');
        case 'list_pages': {
          const query = new URLSearchParams();
          if (toolArgs.status) {
            query.set('status', toolArgs.status);
          }
          const qs = query.toString();
          return toolBridge.request(`/betheme-mcp/v1/pages${qs ? '?' + qs : ''}`, { method: 'GET' });
        }
        case 'get_page':
          return toolBridge.request(`/betheme-mcp/v1/pages/${encodeURIComponent(toolArgs.id)}`, { method: 'GET' });
        case 'create_page':
          return toolBridge.request('/betheme-mcp/v1/pages', { method: 'POST', body: toolArgs });
        case 'update_page':
          return toolBridge.request(`/betheme-mcp/v1/pages/${encodeURIComponent(toolArgs.id)}`, { method: 'PUT', body: toolArgs });
        case 'publish_page':
          return toolBridge.request(`/betheme-mcp/v1/pages/${encodeURIComponent(toolArgs.id)}/publish`, { method: 'POST', body: toolArgs });
        case 'delete_page':
          return toolBridge.request(`/betheme-mcp/v1/pages/${encodeURIComponent(toolArgs.id)}`, { method: 'DELETE', body: toolArgs });
        case 'get_page_builder_payload':
          return toolBridge.request(`/betheme-mcp/v1/pages/${encodeURIComponent(toolArgs.id)}/builder`, { method: 'GET' });
        case 'save_page_builder_payload':
          return toolBridge.request(`/betheme-mcp/v1/pages/${encodeURIComponent(toolArgs.id)}/builder`, { method: 'POST', body: toolArgs });
        case 'list_templates':
          return toolBridge.request('/betheme-mcp/v1/templates', { method: 'GET' });
        case 'get_template':
          return toolBridge.request(`/betheme-mcp/v1/templates/${encodeURIComponent(toolArgs.id)}`, { method: 'GET' });
        case 'create_template':
          return toolBridge.request('/betheme-mcp/v1/templates', { method: 'POST', body: toolArgs });
        case 'update_template':
          return toolBridge.request(`/betheme-mcp/v1/templates/${encodeURIComponent(toolArgs.id)}`, { method: 'PUT', body: toolArgs });
        case 'list_plugins':
          return toolBridge.request('/betheme-mcp/v1/plugins', { method: 'GET' });
        case 'install_plugin':
          return toolBridge.request('/betheme-mcp/v1/plugins/install', { method: 'POST', body: toolArgs });
        case 'activate_plugin':
          return toolBridge.request('/betheme-mcp/v1/plugins/activate', { method: 'POST', body: toolArgs });
        case 'deactivate_plugin':
          return toolBridge.request('/betheme-mcp/v1/plugins/deactivate', { method: 'POST', body: toolArgs });
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    },

    async authenticate(_args = {}, siteName) {
      const toolBridge = await resolveBridge(siteName);
      if (!toolBridge) {
        throw new Error('Bridge authentication is required');
      }
      return toolBridge.request('/betheme-mcp/v1/auth', { method: 'POST' });
    },

    async handleMessage(message) {
      const { id, method, params = {} } = message;

      if (method === 'initialize') {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {},
              prompts: {}
            },
            serverInfo: {
              name: 'betheme-mcp',
              version: '28.5.4-alpha.003'
            }
          }
        };
      }

      if (method === 'tools/list') {
        return {
          jsonrpc: '2.0',
          id,
          result: { tools: this.listTools() }
        };
      }

      if (method === 'tools/call') {
        const toolName = params.name;
        const toolArgs = params.arguments || {};
        try {
          const result = await this.callTool(toolName, toolArgs);
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'json',
                  json: result
                }
              ]
            }
          };
        } catch (error) {
          const isClientError = error.message && (
            /validation failed/i.test(error.message) ||
            /authentication required/i.test(error.message) ||
            /unknown tool/i.test(error.message)
          );
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: isClientError ? -32602 : -32603,
              message: isClientError ? error.message : 'Internal error'
            }
          };
        }
      }

      if (method === 'resources/list') {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            resources: [
              { uri: 'betheme://site', name: 'site-context' },
              { uri: 'betheme://pages', name: 'pages' },
              { uri: 'betheme://templates', name: 'templates' }
            ]
          }
        };
      }

      if (method === 'resources/read') {
        const uri = params.uri;
        return {
          jsonrpc: '2.0',
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({ uri, status: 'available' })
              }
            ]
          }
        };
      }

      if (method === 'prompts/list') {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            prompts: [
              { name: 'build_homepage_from_brief', description: 'Build a homepage from an agent brief' },
              { name: 'create_full_site_from_template', description: 'Create a full site from a template' }
            ]
          }
        };
      }

      if (method === 'prompts/get') {
        const promptName = params.name;
        const promptMap = {
          build_homepage_from_brief: {
            name: 'build_homepage_from_brief',
            description: 'Build a homepage from an agent brief',
            messages: [{ role: 'user', content: 'Create a homepage using the provided brief and BeTheme page layout guidance.' }]
          },
          create_full_site_from_template: {
            name: 'create_full_site_from_template',
            description: 'Create a full site from a template',
            messages: [{ role: 'user', content: 'Create the requested site structure using the available templates and page model.' }]
          }
        };

        return {
          jsonrpc: '2.0',
          id,
          result: promptMap[promptName] || {
            name: promptName,
            description: 'Prompt not found',
            messages: []
          }
        };
      }

      throw new Error(`Unsupported method: ${method}`);
    }
  };
}

export function createStdioTransport({ server, stdin = process.stdin, stdout = process.stdout } = {}) {
  let buffer = '';
  let resolveReady;
  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });

  const writeResponse = (payload) => {
    stdout.write(`${JSON.stringify(payload)}\n`);
  };

  const writeError = (id, code, message) => {
    writeResponse({
      jsonrpc: '2.0',
      id,
      error: { code, message }
    });
  };

  const processChunk = async (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\n/);
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let message = null;
      try {
        message = JSON.parse(trimmed);
      } catch {
        writeError(null, -32700, 'Parse error');
        continue;
      }

      const id = message && typeof message === 'object' ? message.id : null;

      try {
        const response = await server.handleMessage(message);
        if (response) {
          writeResponse(response);
        }
      } catch (error) {
        const isClientError = error.message && (
          /validation failed/i.test(error.message) ||
          /authentication required/i.test(error.message) ||
          /unknown tool/i.test(error.message)
        );
        const code = isClientError ? -32602 : -32603;
        const messageText = isClientError ? error.message : 'Internal error';
        writeError(id, code, messageText);
      }
    }
  };

  stdin.on('data', (chunk) => {
    processChunk(chunk).catch(() => {
      writeError(null, -32603, 'Internal error');
    });
  });

  stdin.on('end', () => {
    resolveReady();
  });

  return { ready };
}

export function startServer({ bridge = null, auditLogger = createAuditLogger() } = {}) {
  const config = loadConfig();
  warnIfInsecure(config);

  const bridgeFactory = bridge
    ? null
    : (siteName) => {
        const site = resolveSite(config, siteName);
        if (!site) {
          throw new Error('No sites configured');
        }
        return createBridgeClientForSite(site);
      };

  const server = createMcpServer({ bridge, bridgeFactory, sites: config.sites, auditLogger });
  return createStdioTransport({ server });
}

const isDirectExecution = typeof process.argv[1] === 'string' && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  startServer();
}
