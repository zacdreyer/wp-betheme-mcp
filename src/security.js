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

export function validateToolArgs(toolName, args) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    throw new Error(`Invalid arguments for ${toolName}`);
  }

  return args;
}
