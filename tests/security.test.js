import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuditLogger, sanitizeToolArgs, validateAgainstSchema } from '../src/security.js';
import { createToolManifest } from '../src/server.js';

test('audit logger serializes events', () => {
  const events = [];
  const logger = createAuditLogger({ write: (entry) => events.push(entry) });
  logger.log({ action: 'tool_call', tool: 'create_page' });

  assert.equal(events.length, 1);
  assert.match(events[0], /tool_call/);
});

test('input validator rejects invalid argument types', () => {
  const manifest = createToolManifest();
  assert.throws(() => sanitizeToolArgs('create_page', null, manifest), /Invalid arguments/i);
  assert.throws(() => sanitizeToolArgs('create_page', 'bad', manifest), /Invalid arguments/i);
});

test('input validator enforces required fields and types', () => {
  const manifest = createToolManifest();
  assert.throws(() => sanitizeToolArgs('get_page', {}, manifest), /id is required/i);
  assert.throws(() => sanitizeToolArgs('get_page', { id: 'abc' }, manifest), /id must be integer/i);
  assert.throws(() => sanitizeToolArgs('create_page', { title: 'Hello', badField: 1 }, manifest), /badField is not allowed/i);
});

test('input validator accepts valid arguments', () => {
  const manifest = createToolManifest();
  const args = sanitizeToolArgs('create_page', { title: 'Hello', slug: 'hello' }, manifest);
  assert.equal(args.title, 'Hello');
  assert.equal(args.slug, 'hello');
});

test('schema validator rejects unknown properties recursively', () => {
  const schema = {
    type: 'object',
    properties: { id: { type: 'integer' } },
    required: ['id']
  };
  const errors = validateAgainstSchema({ id: 1, extra: 'value' }, schema);
  assert.ok(errors.some((e) => /extra is not allowed/i.test(e)));
});
