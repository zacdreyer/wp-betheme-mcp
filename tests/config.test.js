import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';

test('loadConfig returns defaults when no env file exists', () => {
  const config = loadConfig();
  assert.equal(typeof config.baseUrl, 'string');
  assert.equal(typeof config.timeoutMs, 'number');
});
