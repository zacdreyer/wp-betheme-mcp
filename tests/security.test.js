import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuditLogger, validateToolArgs } from '../src/security.js';

test('audit logger serializes events', () => {
  const events = [];
  const logger = createAuditLogger({ write: (entry) => events.push(entry) });
  logger.log({ action: 'tool_call', tool: 'create_page' });

  assert.equal(events.length, 1);
  assert.match(events[0], /tool_call/);
});

test('input validator rejects invalid arguments', () => {
  assert.throws(() => validateToolArgs('create_page', null), /Invalid arguments/i);
  assert.throws(() => validateToolArgs('create_page', 'bad'), /Invalid arguments/i);
});
