// pkg-config.js - Custom configuration for pkg
// This file helps pkg handle Node.js built-in modules correctly

module.exports = {
  // Add empty exports for built-in modules that pkg might have trouble with
  'node:sqlite': {},
  'node:fs': {},
  'node:path': {},
  'node:url': {},
  'node:util': {},
  'node:stream': {},
  'node:buffer': {},
  'node:events': {},
  'node:crypto': {},
  'node:http': {},
  'node:https': {},
  'node:net': {},
  'node:os': {},
  'node:zlib': {},
  'node:dns': {},
  'node:tls': {},
  'node:assert': {},
  'node:child_process': {},
  'node:worker_threads': {},
  'node:perf_hooks': {},
  'node:timers': {},
  'node:constants': {}
};
