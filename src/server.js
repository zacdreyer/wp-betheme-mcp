import { pathToFileURL } from 'node:url';
import { createAuditLogger, validateToolArgs } from './security.js';

export function createToolManifest() {
  return [
    {
      name: 'health_check',
      description: 'Verify that the MCP bridge and WordPress site are reachable.',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'authenticate',
      description: 'Authenticate the bridge session for a high-privilege admin workflow.',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'get_site_context',
      description: 'Return a safe summary of the WordPress site and theme context for an agent.',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'get_capabilities',
      description: 'Return the capabilities exposed by the bridge and the current authentication context.',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'list_pages',
      description: 'List pages available in WordPress.',
      inputSchema: { type: 'object', properties: { status: { type: 'string' } } }
    },
    {
      name: 'get_page',
      description: 'Retrieve a specific WordPress page.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      }
    },
    {
      name: 'create_page',
      description: 'Create a new page in WordPress.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          slug: { type: 'string' },
          content: { type: 'string' },
          builder_payload: { type: 'object' },
          meta: { type: 'object' }
        },
        required: ['title']
      }
    },
    {
      name: 'update_page',
      description: 'Update an existing WordPress page.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          content: { type: 'string' },
          builder_payload: { type: 'object' },
          meta: { type: 'object' }
        },
        required: ['id']
      }
    },
    {
      name: 'publish_page',
      description: 'Publish a draft page.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      }
    },
    {
      name: 'delete_page',
      description: 'Delete a WordPress page.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      }
    },
    {
      name: 'get_page_builder_payload',
      description: 'Retrieve the stored BeBuilder payload for a page.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      }
    },
    {
      name: 'save_page_builder_payload',
      description: 'Persist a BeBuilder payload for a page.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          builder_payload: { type: 'object' }
        },
        required: ['id', 'builder_payload']
      }
    },
    {
      name: 'list_templates',
      description: 'List available BeTheme templates.',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'get_template',
      description: 'Retrieve a specific BeTheme template.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      }
    },
    {
      name: 'create_template',
      description: 'Create a new BeTheme template.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          type: { type: 'string' },
          content: { type: 'string' },
          builder_payload: { type: 'object' },
          meta: { type: 'object' }
        },
        required: ['title', 'type']
      }
    },
    {
      name: 'update_template',
      description: 'Update an existing BeTheme template.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          type: { type: 'string' },
          content: { type: 'string' },
          builder_payload: { type: 'object' },
          meta: { type: 'object' }
        },
        required: ['id']
      }
    },
    {
      name: 'list_plugins',
      description: 'List installed or available plugins.',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'install_plugin',
      description: 'Install and activate a plugin from the WordPress ecosystem.',
      inputSchema: {
        type: 'object',
        properties: {
          slug: { type: 'string' }
        },
        required: ['slug']
      }
    },
    {
      name: 'activate_plugin',
      description: 'Activate an installed plugin.',
      inputSchema: {
        type: 'object',
        properties: {
          slug: { type: 'string' }
        },
        required: ['slug']
      }
    },
    {
      name: 'deactivate_plugin',
      description: 'Deactivate an installed plugin.',
      inputSchema: {
        type: 'object',
        properties: {
          slug: { type: 'string' }
        },
        required: ['slug']
      }
    }
  ];
}

export function createMcpServer({ bridge = null, auditLogger = createAuditLogger() } = {}) {
  return {
    listTools() {
      return createToolManifest();
    },

    async callTool(name, args = {}) {
      const safeArgs = validateToolArgs(name, args);

      if (!bridge) {
        throw new Error('Bridge authentication is required');
      }

      auditLogger.log({ action: 'tool_call', tool: name, args: safeArgs });

      switch (name) {
        case 'health_check':
          return bridge.request('/betheme-mcp/v1/health');
        case 'authenticate':
          return bridge.request('/betheme-mcp/v1/health');
        case 'get_site_context':
          return bridge.request('/betheme-mcp/v1/site');
        case 'get_capabilities':
          return bridge.request('/betheme-mcp/v1/capabilities');
        case 'list_pages':
          return bridge.request('/betheme-mcp/v1/pages', { method: 'GET' });
        case 'get_page':
          return bridge.request(`/betheme-mcp/v1/pages/${encodeURIComponent(safeArgs.id)}`, { method: 'GET' });
        case 'create_page':
          return bridge.request('/betheme-mcp/v1/pages', { method: 'POST', body: safeArgs });
        case 'update_page':
          return bridge.request(`/betheme-mcp/v1/pages/${encodeURIComponent(safeArgs.id)}`, { method: 'PUT', body: safeArgs });
        case 'publish_page':
          return bridge.request(`/betheme-mcp/v1/pages/${encodeURIComponent(safeArgs.id)}/publish`, { method: 'POST', body: safeArgs });
        case 'delete_page':
          return bridge.request(`/betheme-mcp/v1/pages/${encodeURIComponent(safeArgs.id)}`, { method: 'DELETE', body: safeArgs });
        case 'get_page_builder_payload':
          return bridge.request(`/betheme-mcp/v1/pages/${encodeURIComponent(safeArgs.id)}/builder`, { method: 'GET' });
        case 'save_page_builder_payload':
          return bridge.request(`/betheme-mcp/v1/pages/${encodeURIComponent(safeArgs.id)}/builder`, { method: 'POST', body: safeArgs });
        case 'list_templates':
          return bridge.request('/betheme-mcp/v1/templates', { method: 'GET' });
        case 'get_template':
          return bridge.request(`/betheme-mcp/v1/templates/${encodeURIComponent(safeArgs.id)}`, { method: 'GET' });
        case 'create_template':
          return bridge.request('/betheme-mcp/v1/templates', { method: 'POST', body: safeArgs });
        case 'update_template':
          return bridge.request(`/betheme-mcp/v1/templates/${encodeURIComponent(safeArgs.id)}`, { method: 'PUT', body: safeArgs });
        case 'list_plugins':
          return bridge.request('/betheme-mcp/v1/plugins', { method: 'GET' });
        case 'install_plugin':
          return bridge.request('/betheme-mcp/v1/plugins/install', { method: 'POST', body: safeArgs });
        case 'activate_plugin':
          return bridge.request('/betheme-mcp/v1/plugins/activate', { method: 'POST', body: safeArgs });
        case 'deactivate_plugin':
          return bridge.request('/betheme-mcp/v1/plugins/deactivate', { method: 'POST', body: safeArgs });
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
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
              version: '28.5.4'
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

  const processChunk = async (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\n/);
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const message = JSON.parse(trimmed);
        const response = await server.handleMessage(message);
        if (response) {
          writeResponse(response);
        }
      } catch (error) {
        writeResponse({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: error.message
          }
        });
      }
    }
  };

  stdin.on('data', (chunk) => {
    processChunk(chunk).catch((error) => {
      writeResponse({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error.message
        }
      });
    });
  });

  stdin.on('end', () => {
    resolveReady();
  });

  return { ready };
}

export function startServer({ bridge = null, auditLogger = createAuditLogger() } = {}) {
  const server = createMcpServer({ bridge, auditLogger });
  return createStdioTransport({ server });
}

const isDirectExecution = typeof process.argv[1] === 'string' && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  startServer();
}
