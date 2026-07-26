export function createAuditLogger({ write = console.log } = {}) {
  return {
    log(event) {
      write(JSON.stringify({
        timestamp: new Date().toISOString(),
        ...event
      }));
    }
  };
}

function validateType(value, type) {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    case 'boolean':
      return typeof value === 'boolean';
    default:
      return true;
  }
}

export function validateAgainstSchema(value, schema, path = '') {
  if (!schema || typeof schema !== 'object') {
    return [];
  }

  const errors = [];

  if (schema.type && !validateType(value, schema.type)) {
    errors.push(`${path || 'value'} must be ${schema.type}`);
    return errors;
  }

  if (schema.type === 'object' && schema.properties) {
    const required = schema.required || [];
    for (const key of required) {
      if (!(key in value)) {
        errors.push(`${path || 'value'}.${key} is required`);
      }
    }

    for (const key of Object.keys(value)) {
      if (!(key in schema.properties)) {
        errors.push(`${path || 'value'}.${key} is not allowed`);
      } else {
        errors.push(...validateAgainstSchema(value[key], schema.properties[key], `${path}.${key}`.replace(/^\./, '')));
      }
    }
  }

  return errors;
}

export function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
}

export function sanitizeToolArgs(toolName, args, manifest) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    throw new Error(`Invalid arguments for ${toolName}`);
  }

  const tool = manifest.find((t) => t.name === toolName);
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  const errors = validateAgainstSchema(args, tool.inputSchema);
  if (errors.length > 0) {
    throw new Error(`Validation failed for ${toolName}: ${errors.join('; ')}`);
  }

  return JSON.parse(JSON.stringify(args));
}
