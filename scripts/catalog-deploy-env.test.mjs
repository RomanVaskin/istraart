import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, copyFileSync, readdirSync, rmSync, openSync, closeSync, chmodSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { catalogDeployEnvironment } from './catalog-deploy-env.mjs'
const source = new URL('./catalog-deploy-env.mjs', import.meta.url)
const root = new URL('../', import.meta.url)
const env = { OLNOO_CATALOG_TOKEN: 'site-test-token-'.repeat(3), OLNOO_CATALOG_BASIC_AUTH: 'reader:pass:$"\'`\\ word:tail:' }
const workflow = readFileSync(new URL('.github/workflows/deploy.yml', root), 'utf8')
const installer = workflow.match(/remote_script=\$\(cat <<'REMOTE_CATALOG'\n([\s\S]*?)\n\s*REMOTE_CATALOG/)?.[1].replace(/^ {10}/gm, '')

// Unit-test wrappers record the ACL command contract; a separate integration test probes real ACL support.
function recordedAclEnvironment(dir) {
  const bin = join(dir, 'acl-bin')
  mkdirSync(bin)
  writeFileSync(join(bin, 'setfacl'), `#!/bin/sh
set -eu
test "$1" = '--set=u::rw-,u:www-data:r--,g::---,m::r--,o::---'
printf '%s\\n' "$@" > .acl-arguments
printf 'user::rw-\\nuser:www-data:r--\\ngroup::---\\nmask::r--\\nother::---\\n' > .acl-readback
`, { mode: 0o755 })
  writeFileSync(join(bin, 'getfacl'), '#!/bin/sh\ncat .acl-readback\n', { mode: 0o755 })
  return { ...process.env, PATH: bin + ':' + process.env.PATH }
}

test('Basic Auth punctuation, spaces, dollar signs and colon round-trip exactly in JSON', () => {
  const payload = JSON.parse(JSON.stringify(catalogDeployEnvironment(env)))
  assert.equal(payload.OLNOO_CATALOG_BASIC_AUTH, env.OLNOO_CATALOG_BASIC_AUTH)
  assert.equal(payload.OLNOO_CATALOG_TOKEN, env.OLNOO_CATALOG_TOKEN)
  assert.equal(payload.OLNOO_CATALOG_URL, 'https://admin.olnoo.com')
})
test('missing or malformed mandatory credentials fail without printing them', () => {
  for (const invalid of [{ ...env, OLNOO_CATALOG_TOKEN: '' }, { ...env, OLNOO_CATALOG_TOKEN: 'short' }, { ...env, OLNOO_CATALOG_BASIC_AUTH: '' }, { ...env, OLNOO_CATALOG_BASIC_AUTH: 'username' }, { ...env, OLNOO_CATALOG_BASIC_AUTH: 'user:' }, { ...env, OLNOO_CATALOG_BASIC_AUTH: 'user:password\n' }]) {
    const child = spawnSync(process.execPath, [source.pathname], { env: { ...process.env, ...invalid }, encoding: 'utf8' })
    assert.notEqual(child.status, 0)
    assert.equal(child.stdout, '')
    assert.equal(child.stderr.includes(env.OLNOO_CATALOG_TOKEN), false)
    assert.equal(child.stderr.includes(env.OLNOO_CATALOG_BASIC_AUTH), false)
  }
})
test('remote installer preserves .env.local and refuses truncated input with the exact named-user ACL', () => {
  assert.ok(installer)
  const dir = mkdtempSync(join(tmpdir(), 'catalog-site-install-'))
  try {
    writeFileSync(join(dir, '.env.local'), 'EXISTING_KEY=unchanged\n', { mode: 0o600 })
    const installerEnv = recordedAclEnvironment(dir)
    const payload = JSON.stringify(catalogDeployEnvironment(env))
    writeFileSync(join(dir, 'payload'), payload)
    let fd = openSync(join(dir, 'payload'), 'r')
    const installed = spawnSync('bash', ['-c', installer], { cwd: dir, env: installerEnv, stdio: [fd, 'pipe', 'pipe'], encoding: 'utf8', timeout: 10000 })
    closeSync(fd)
    assert.equal(installed.status, 0, installed.stderr)
    assert.equal(installed.stdout.includes(env.OLNOO_CATALOG_BASIC_AUTH), false)
    assert.equal(readFileSync(join(dir, '.env.catalog.json'), 'utf8'), payload)
    assert.ok(readFileSync(join(dir, '.acl-arguments'), 'utf8').startsWith('--set=u::rw-,u:www-data:r--,g::---,m::r--,o::---\n'))
    writeFileSync(join(dir, 'payload'), payload.slice(0, -2))
    fd = openSync(join(dir, 'payload'), 'r')
    const failed = spawnSync('bash', ['-c', installer], { cwd: dir, env: installerEnv, stdio: [fd, 'pipe', 'pipe'], encoding: 'utf8', timeout: 10000 })
    closeSync(fd)
    assert.notEqual(failed.status, 0)
    assert.equal(failed.stderr.includes(env.OLNOO_CATALOG_TOKEN), false)
    assert.equal(readFileSync(join(dir, '.env.catalog.json'), 'utf8'), payload)
    assert.equal(readFileSync(join(dir, '.env.local'), 'utf8'), 'EXISTING_KEY=unchanged\n')
    assert.equal(readdirSync(dir).some((name) => name.startsWith('.env.catalog.json.')), false)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
test('next.config loads credentials in a fresh runtime without CI env and without exposing config.env', () => {
  const dir = mkdtempSync(join(tmpdir(), 'catalog-site-runtime-'))
  try {
    mkdirSync(join(dir, 'scripts'))
    copyFileSync(source, join(dir, 'scripts/catalog-deploy-env.mjs'))
    copyFileSync(new URL('next.config.mjs', root), join(dir, 'next.config.mjs'))
    writeFileSync(join(dir, '.env.catalog.json'), JSON.stringify(catalogDeployEnvironment(env)))
    const childEnv = { ...process.env }; for (const key of Object.keys(env)) delete childEnv[key]
    writeFileSync(join(dir, 'runtime.mjs'), `const {default: config}=await import('./next.config.mjs'); if(!process.env.OLNOO_CATALOG_TOKEN || !process.env.OLNOO_CATALOG_BASIC_AUTH || process.env.OLNOO_CATALOG_URL!=='https://admin.olnoo.com' || config.env) process.exit(1); (await import('node:fs')).writeFileSync('runtime-ok', 'runtime environment loaded');`)
    const child = spawnSync(process.execPath, [join(dir, 'runtime.mjs')], { cwd: dir, env: childEnv, encoding: 'utf8', timeout: 10000 })
    assert.equal(child.status, 0, child.stderr)
    assert.equal(readFileSync(join(dir, 'runtime-ok'), 'utf8'), 'runtime environment loaded')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('workflow CLI writes only validated JSON to a private payload file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'catalog-cli-'))
  try {
    const file = join(dir, 'payload')
    const fd = openSync(file, 'w', 0o600)
    const child = spawnSync(process.execPath, [source.pathname], { env: { ...process.env, ...env }, stdio: ['ignore', fd, 'pipe'], encoding: 'utf8', timeout: 10000 })
    closeSync(fd)
    assert.equal(child.status, 0, child.stderr)
    assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')), catalogDeployEnvironment(env))
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('an unreadable delivered file stops Next configuration before a server can listen', () => {
  const dir = mkdtempSync(join(tmpdir(), 'catalog-unreadable-'))
  try {
    mkdirSync(join(dir, 'scripts'))
    copyFileSync(source, join(dir, 'scripts/catalog-deploy-env.mjs'))
    copyFileSync(new URL('next.config.mjs', root), join(dir, 'next.config.mjs'))
    const file = join(dir, '.env.catalog.json')
    writeFileSync(file, JSON.stringify(catalogDeployEnvironment(env)), { mode: 0o600 })
    chmodSync(file, 0o000)
    writeFileSync(join(dir, 'start.mjs'), "await import('./next.config.mjs')")
    const child = spawnSync(process.execPath, [join(dir, 'start.mjs')], { cwd: dir, encoding: 'utf8', timeout: 10000 })
    if (process.getuid?.() !== 0) assert.notEqual(child.status, 0)
    chmodSync(file, 0o600)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('missing ACL tools fail before replacing the existing environment', () => {
  const dir = mkdtempSync(join(tmpdir(), 'catalog-no-acl-'))
  try {
    mkdirSync(join(dir, 'empty-bin'))
    writeFileSync(join(dir, '.env.catalog.json'), 'previous environment')
    const child = spawnSync('/bin/bash', ['-c', installer], { cwd: dir, env: { ...process.env, PATH: join(dir, 'empty-bin') }, encoding: 'utf8', timeout: 10000 })
    assert.notEqual(child.status, 0)
    assert.equal(readFileSync(join(dir, '.env.catalog.json'), 'utf8'), 'previous environment')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('real filesystem ACL grants www-data read-only, excludes inherited strangers and group/other access', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'catalog-real-acl-'))
  try {
    const file = join(dir, 'fixture')
    writeFileSync(file, 'synthetic fixture only', { mode: 0o600 })
    const acl = 'u::rw-,u:www-data:r--,g::---,m::r--,o::---'
    const applied = spawnSync('setfacl', ['--set='+acl, file], { encoding: 'utf8', timeout: 10000 })
    if (applied.status !== 0) { t.skip('Local environment lacks setfacl, mapped www-data UID or filesystem ACL support; verify the real ACL on RU after approved deploy'); return }
    const output = join(dir, 'acl-output'); const fd = openSync(output, 'w')
    const inspected = spawnSync('getfacl', ['--omit-header', '--absolute-names', file], { stdio: ['ignore', fd, 'pipe'], encoding: 'utf8', timeout: 10000 })
    closeSync(fd)
    assert.equal(inspected.status, 0)
    assert.equal(readFileSync(output,'utf8').trim(), 'user::rw-\nuser:www-data:r--\ngroup::---\nmask::r--\nother::---')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
