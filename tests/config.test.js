import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig, resolveSite, warnIfInsecure } from '../src/config.js';

test('loadConfig returns defaults when no env file exists', () => {
  const config = loadConfig();
  assert.equal(typeof config.baseUrl, 'string');
  assert.equal(typeof config.timeoutMs, 'number');
  assert.ok(Array.isArray(config.sites));
  assert.equal(config.sites.length, 1);
  assert.equal(config.sites[0].name, 'default');
});

test('warnIfInsecure warns for non-local HTTP base URLs', () => {
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (message) => warnings.push(message);

  warnIfInsecure({
    sites: [{ name: 'default', baseUrl: 'http://example.com/wp-json', apiKey: 'key' }]
  });
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /HTTPS/i);

  warnIfInsecure({
    sites: [{ name: 'default', baseUrl: 'http://localhost:8080', apiKey: 'key' }]
  });
  assert.equal(warnings.length, 1);

  console.warn = originalWarn;
});

test('resolveSite returns the requested site or the first configured site', () => {
  const config = {
    sites: [
      { name: 'client-a', baseUrl: 'https://a.test', apiKey: 'key-a' },
      { name: 'client-b', baseUrl: 'https://b.test', apiKey: 'key-b' }
    ]
  };

  assert.equal(resolveSite(config, 'client-b').name, 'client-b');
  assert.equal(resolveSite(config, '').name, 'client-a');
  assert.equal(resolveSite(config, 'unknown').name, 'client-a');
  assert.equal(resolveSite({ sites: [] }, 'client-a'), null);
});
