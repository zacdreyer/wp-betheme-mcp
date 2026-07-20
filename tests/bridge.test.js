import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createBridgeClient } from '../src/bridge.js';

test('bridge client loads base URL and API key from environment config', async () => {
  let seen = null;
  const server = createServer((req, res) => {
    seen = {
      method: req.method,
      path: req.url,
      apiKey: req.headers['x-api-key']
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  });

  await new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => resolve());
    server.on('error', reject);
  });

  const address = server.address();
  const oldBaseUrl = process.env.BETHEME_MCP_BASE_URL;
  const oldApiKey = process.env.BETHEME_MCP_API_KEY;

  process.env.BETHEME_MCP_BASE_URL = `http://127.0.0.1:${address.port}`;
  process.env.BETHEME_MCP_API_KEY = 'env-key';

  try {
    const client = createBridgeClient({});
    const response = await client.request('/betheme-mcp/v1/health');

    assert.deepEqual(response, { ok: true });
    assert.equal(seen.path, '/betheme-mcp/v1/health');
    assert.equal(seen.method, 'GET');
    assert.equal(seen.apiKey, 'env-key');
  } finally {
    process.env.BETHEME_MCP_BASE_URL = oldBaseUrl;
    process.env.BETHEME_MCP_API_KEY = oldApiKey;

    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
