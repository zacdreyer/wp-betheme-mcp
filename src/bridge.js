import { loadConfig } from './config.js';

export function createBridgeClient({ baseUrl, apiKey } = {}) {
  const config = loadConfig();
  const resolvedBaseUrl = baseUrl || config.baseUrl || process.env.BETHEME_MCP_BASE_URL;
  const resolvedApiKey = apiKey || config.apiKey || process.env.BETHEME_MCP_API_KEY;

  return {
    async request(path, options = {}) {
      if (!resolvedApiKey) {
        throw new Error('Bridge authentication is required');
      }

      const headers = {
        'Content-Type': 'application/json',
        'X-API-Key': resolvedApiKey,
        ...(options.headers || {})
      };

      const controller = new AbortController();
      const timeoutMs = Number(options.timeoutMs || config.timeoutMs || process.env.BETHEME_MCP_TIMEOUT_MS || 10000);
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(new URL(path, resolvedBaseUrl || 'http://localhost:8080'), {
          method: options.method || 'GET',
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
