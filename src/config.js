import fs from 'node:fs';
import path from 'node:path';

export function loadConfig() {
  const envPath = path.resolve(process.cwd(), '.env');
  const config = {
    apiKey: process.env.BETHEME_MCP_API_KEY || '',
    baseUrl: process.env.BETHEME_MCP_BASE_URL || 'http://localhost:8080',
    timeoutMs: Number(process.env.BETHEME_MCP_TIMEOUT_MS || 10000)
  };

  if (fs.existsSync(envPath)) {
    const contents = fs.readFileSync(envPath, 'utf8');
    for (const line of contents.split(/\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        if (key === 'BETHEME_MCP_API_KEY') config.apiKey = value;
        if (key === 'BETHEME_MCP_BASE_URL') config.baseUrl = value;
        if (key === 'BETHEME_MCP_TIMEOUT_MS') config.timeoutMs = Number(value);
      }
    }
  }

  return config;
}
