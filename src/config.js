import fs from 'node:fs';
import path from 'node:path';

export function loadConfig() {
  const envPath = path.resolve(process.cwd(), '.env');
  const sitesPath = path.resolve(process.cwd(), 'sites.json');

  const config = {
    apiKey: process.env.BETHEME_MCP_API_KEY || '',
    baseUrl: process.env.BETHEME_MCP_BASE_URL || 'http://localhost:8080',
    timeoutMs: Number(process.env.BETHEME_MCP_TIMEOUT_MS || 10000),
    sites: []
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

  if (fs.existsSync(sitesPath)) {
    try {
      const sites = JSON.parse(fs.readFileSync(sitesPath, 'utf8'));
      if (Array.isArray(sites)) {
        config.sites = sites;
      }
    } catch {
      console.warn('[BeTheme MCP] Warning: sites.json exists but is not valid JSON');
    }
  }

  if (process.env.BETHEME_MCP_SITES) {
    try {
      const sites = JSON.parse(process.env.BETHEME_MCP_SITES);
      if (Array.isArray(sites)) {
        config.sites = sites;
      }
    } catch {
      console.warn('[BeTheme MCP] Warning: BETHEME_MCP_SITES is not valid JSON');
    }
  }

  if (config.sites.length === 0) {
    config.sites.push({
      name: 'default',
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      timeoutMs: config.timeoutMs
    });
  }

  return config;
}

export function resolveSite(config, siteName = '') {
  if (!config || !Array.isArray(config.sites) || config.sites.length === 0) {
    return null;
  }

  if (!siteName) {
    return config.sites[0];
  }

  const site = config.sites.find((s) => s.name === siteName);
  return site || config.sites[0];
}

export function warnIfInsecure(config) {
  const sites = config && Array.isArray(config.sites) ? config.sites : [];
  for (const site of sites) {
    if (site.baseUrl && site.baseUrl.startsWith('http://')) {
      const host = site.baseUrl.replace(/^http:\/\//, '').split(':')[0];
      if (host !== 'localhost' && host !== '127.0.0.1') {
        console.warn(`[BeTheme MCP] Warning: site "${site.name}" uses HTTP. Use HTTPS in production to protect the API key and request signatures.`);
      }
    }
  }
}
