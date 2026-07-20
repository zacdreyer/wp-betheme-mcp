import test from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough, Writable } from 'node:stream';
import { createMcpServer, createStdioTransport, createToolManifest } from '../src/server.js';

test('server exposes the core BeTheme management tools', () => {
  const server = createMcpServer();
  const tools = server.listTools();
  const names = tools.map((tool) => tool.name);

  assert.ok(names.includes('create_page'));
  assert.ok(names.includes('create_template'));
  assert.ok(names.includes('install_plugin'));
  assert.ok(names.includes('publish_page'));
  assert.ok(names.includes('delete_page'));
  assert.ok(names.includes('get_page_builder_payload'));
  assert.ok(names.includes('save_page_builder_payload'));
  assert.ok(names.includes('activate_plugin'));
  assert.ok(names.includes('deactivate_plugin'));
  assert.ok(names.includes('authenticate'));
  assert.ok(names.includes('get_site_context'));
  assert.ok(names.includes('get_capabilities'));
});

test('tool manifest includes MCP-ready page and template operations', () => {
  const manifest = createToolManifest();
  const names = manifest.map((tool) => tool.name);

  assert.deepEqual(names.slice(0, 4), ['health_check', 'authenticate', 'get_site_context', 'get_capabilities']);
});

test('server rejects calls without bridge authentication', async () => {
  const server = createMcpServer();

  await assert.rejects(() => server.callTool('list_plugins', {}), /authentication/i);
});

test('server routes page updates to the correct bridge endpoint', async () => {
  const calls = [];
  const bridge = {
    async request(path, options = {}) {
      calls.push({ path, options });
      return { ok: true, path, method: options.method || 'GET' };
    }
  };

  const server = createMcpServer({ bridge });
  await server.callTool('update_page', { id: 42, title: 'Updated page' });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/betheme-mcp/v1/pages/42');
  assert.equal(calls[0].options.method, 'PUT');
});

test('server routes builder payload operations to the page builder endpoints', async () => {
  const calls = [];
  const bridge = {
    async request(path, options = {}) {
      calls.push({ path, options });
      return { ok: true, path, method: options.method || 'GET' };
    }
  };

  const server = createMcpServer({ bridge });
  await server.callTool('get_page_builder_payload', { id: 24 });
  await server.callTool('save_page_builder_payload', { id: 24, builder_payload: { sections: [] } });

  assert.equal(calls[0].path, '/betheme-mcp/v1/pages/24/builder');
  assert.equal(calls[0].options.method, 'GET');
  assert.equal(calls[1].path, '/betheme-mcp/v1/pages/24/builder');
  assert.equal(calls[1].options.method, 'POST');
});

test('server supports MCP resources and prompts retrieval', async () => {
  const server = createMcpServer();
  const resources = await server.handleMessage({ id: 11, method: 'resources/read', params: { uri: 'betheme://site' } });
  const prompt = await server.handleMessage({ id: 12, method: 'prompts/get', params: { name: 'build_homepage_from_brief' } });

  assert.match(resources.result.contents[0].text, /betheme:\/\/site/);
  assert.equal(prompt.result.name, 'build_homepage_from_brief');
});

test('stdio transport emits JSON-RPC responses for newline-delimited messages', async () => {
  const stdin = new PassThrough();
  const stdoutChunks = [];
  const stdout = new Writable({
    write(chunk, _encoding, callback) {
      stdoutChunks.push(chunk.toString());
      callback();
    }
  });

  const server = {
    async handleMessage(message) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        result: { ok: true }
      };
    }
  };

  const transport = createStdioTransport({ server, stdin, stdout });
  stdin.write('{"jsonrpc":"2.0","id":7,"method":"initialize"}\n');
  stdin.end();
  await transport.ready;

  assert.equal(stdoutChunks.join(''), '{"jsonrpc":"2.0","id":7,"result":{"ok":true}}\n');
});
