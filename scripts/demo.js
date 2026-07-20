import { createServer } from 'node:http';
import { createBridgeClient } from '../src/bridge.js';
import { createMcpServer } from '../src/server.js';

async function startDemoBridge() {
  const bridgeServer = createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const apiKey = req.headers['x-api-key'];

    if (apiKey !== 'demo-key') {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Authentication required' }));
      return;
    }

    if (url.pathname === '/betheme-mcp/v1/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, site: 'Demo BeTheme Site' }));
      return;
    }

    if (url.pathname === '/betheme-mcp/v1/site') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ site: 'Demo BeTheme Site', url: 'https://example.test', theme: 'BeTheme', themeVersion: '28.5.4' }));
      return;
    }

    if (url.pathname === '/betheme-mcp/v1/capabilities') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ version: '28.5.4', authenticated: true, capabilities: ['pages', 'templates', 'plugins', 'builder_metadata'] }));
      return;
    }

    if (url.pathname === '/betheme-mcp/v1/pages' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id: 101, status: 'draft', payload: JSON.parse(body) }));
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Route not found' }));
  });

  await new Promise((resolve, reject) => {
    bridgeServer.listen(0, '127.0.0.1', () => resolve());
    bridgeServer.on('error', reject);
  });

  return bridgeServer;
}

async function main() {
  const bridgeServer = await startDemoBridge();
  const address = bridgeServer.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const bridge = createBridgeClient({ baseUrl, apiKey: 'demo-key' });
  const server = createMcpServer({ bridge });

  const results = await Promise.all([
    server.callTool('health_check', {}),
    server.callTool('get_site_context', {}),
    server.callTool('get_capabilities', {}),
    server.callTool('create_page', { title: 'Demo page', content: 'Hello from the demo harness' })
  ]);

  console.log(JSON.stringify({ results }, null, 2));

  await new Promise((resolve, reject) => {
    bridgeServer.close((error) => (error ? reject(error) : resolve()));
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
