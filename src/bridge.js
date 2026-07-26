import { createHmac } from 'node:crypto';
import { loadConfig } from './config.js';

export function signRequest({ apiKey, method, body, timestamp }) {
  const payload = body ? JSON.stringify(body) : '';
  const message = `${method.toUpperCase()}|${timestamp}|${payload}`;
  return createHmac('sha256', apiKey).update(message).digest('hex');
}

export function createBridgeClient({ baseUrl, apiKey } = {}) {
  const config = loadConfig();
  const resolvedBaseUrl = baseUrl || config.baseUrl || process.env.BETHEME_MCP_BASE_URL;
  const resolvedApiKey = apiKey || config.apiKey || process.env.BETHEME_MCP_API_KEY;

  return {
    async request(path, options = {}) {
      if (!resolvedApiKey) {
        throw new Error('Bridge authentication is required');
      }

      const method = options.method || 'GET';
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = signRequest({
        apiKey: resolvedApiKey,
        method,
        body: options.body,
        timestamp
      });

      const headers = {
        'Content-Type': 'application/json',
        'X-API-Key': resolvedApiKey,
        'X-Request-Timestamp': timestamp,
        'X-Request-Signature': signature,
        ...(options.headers || {})
      };

      const controller = new AbortController();
      const timeoutMs = Number(options.timeoutMs || config.timeoutMs || process.env.BETHEME_MCP_TIMEOUT_MS || 10000);
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(new URL(path, resolvedBaseUrl || 'http://localhost:8080'), {
          method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.message || 'Bridge request failed');
        }

        return payload;
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error(`Bridge request timed out after ${timeoutMs}ms`);
        }
        throw error;
      } finally {
        clearTimeout(timer);
      }
    }
  };
}
