import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createServer } from 'node:http';
import { createBridgeClient, signRequest } from '../src/bridge.js';

function verifySignature({ apiKey, method, body, timestamp, signature }) {
  const payload = body ? JSON.stringify(body) : '';
  const message = `${method.toUpperCase()}|${timestamp}|${payload}`;
  const expected = createHmac('sha256', apiKey).update(message).digest('hex');
  return expected === signature;
}

test('signRequest produces a reproducible HMAC signature', () => {
  const signature = signRequest({
    apiKey: 'test-key',
    method: 'POST',
    body: { title: 'Test' },
    timestamp: '1234567890'
  });

  const valid = verifySignature({
    apiKey: 'test-key',
    method: 'POST',
    body: { title: 'Test' },
    timestamp: '1234567890',
    signature
  });

  assert.equal(valid, true);
});

test('bridge client loads base URL and API key from environment config', async () => {
  let seen = null;
  const server = createServer((req, res) => {
    seen = {
      method: req.method,
      path: req.url,
      apiKey: req.headers['x-api-key'],
      timestamp: req.headers['x-request-timestamp'],
      signature: req.headers['x-request-signature']
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
    assert.ok(seen.timestamp, 'timestamp header should be present');
    assert.ok(seen.signature, 'signature header should be present');

    const valid = verifySignature({
      apiKey: 'env-key',
      method: 'GET',
      body: undefined,
      timestamp: seen.timestamp,
      signature: seen.signature
    });
    assert.equal(valid, true);
  } finally {
    process.env.BETHEME_MCP_BASE_URL = oldBaseUrl;
    process.env.BETHEME_MCP_API_KEY = oldApiKey;

    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
