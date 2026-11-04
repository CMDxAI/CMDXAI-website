// Turns the backend's raw openapi.json into the public spec at openapi/cmdx-lms.json.
// Usage: node scripts/filter-openapi.mjs <raw-openapi.json> <backend-commit>
//
// Drops routes readers never call (test helpers, the install wizard, vendor callbacks, the
// SCORM player's content routes). Keeps only the first paragraph of every description: later
// paragraphs are implementation notes for backend maintainers. Removes tracker references.
import { readFileSync, writeFileSync } from 'node:fs';

const [raw, commit] = process.argv.slice(2);
if (!raw || !commit) throw new Error('usage: filter-openapi.mjs <raw-openapi.json> <backend-commit>');

const DROP_TAGS = new Set(['testing', 'install', 'provider-webhooks', 'notification-webhooks', 'scorm-content']);
const keepPath = (p) => p.startsWith('/api/v1/') && !p.startsWith('/api/v1/developer/testing/');
const REF = /\s*\((?:#\d+|GAP-\d+)[^)]*\)|#\d{3,}|GAP-\d+/g;

const spec = JSON.parse(readFileSync(raw, 'utf8'));

for (const [path, ops] of Object.entries(spec.paths)) {
  if (!keepPath(path)) { delete spec.paths[path]; continue; }
  for (const [method, op] of Object.entries(ops)) {
    if (typeof op !== 'object' || Array.isArray(op)) continue;
    if ((op.tags ?? []).some((t) => DROP_TAGS.has(t))) delete ops[method];
    // ponytail: the only untagged /api/v1 routes are /me/enrollments; re-check on regenerate.
    else if (!op.tags?.length) op.tags = ['enrollments'];
  }
  if (!Object.keys(ops).length) delete spec.paths[path];
}

// Drop component schemas that only the removed routes used.
const used = new Set();
const visit = (node) => {
  if (Array.isArray(node)) return node.forEach(visit);
  if (!node || typeof node !== 'object') return;
  const name = node.$ref?.match(/^#\/components\/schemas\/(.+)$/)?.[1];
  if (name && !used.has(name)) { used.add(name); visit(spec.components.schemas[name]); }
  Object.values(node).forEach(visit);
};
visit(spec.paths);
for (const name of Object.keys(spec.components.schemas)) if (!used.has(name)) delete spec.components.schemas[name];

const clean = (node) => {
  if (Array.isArray(node)) return node.forEach(clean);
  if (!node || typeof node !== 'object') return;
  for (const [k, v] of Object.entries(node)) {
    if (k === 'description' && typeof v === 'string') node[k] = v.trim().split(/\n\s*\n/)[0].replace(REF, '').trim();
    else clean(v);
  }
};
clean(spec);

spec.info = {
  title: 'CMDX LMS API',
  version: spec.info.version,
  description:
    'REST API of the CMDX learning management system. Generated from the backend source; ' +
    'see Authentication, Errors, and Pagination and filtering for the conventions every endpoint follows.',
  'x-source-commit': commit,
};
spec.servers = [{ url: 'https://{host}', variables: { host: { default: 'lms.example.com', description: 'Your CMDX host' } } }];

const out = JSON.stringify(spec, null, 2) + '\n';
const leaks = out.match(/#\d{3,}|GAP-\d+|\/testing\/|\/install\//g);
if (leaks) throw new Error(`filtered spec still contains: ${[...new Set(leaks)].join(', ')}`);
writeFileSync(new URL('../openapi/cmdx-lms.json', import.meta.url), out);
console.log(`${Object.keys(spec.paths).length} paths, ${Object.keys(spec.components.schemas).length} schemas`);
