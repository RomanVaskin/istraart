import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export function catalogDeployEnvironment(env) {
  const token = env.OLNOO_CATALOG_TOKEN
  const basic = env.OLNOO_CATALOG_BASIC_AUTH
  if (typeof token !== 'string' || !/^[\x21-\x7e]{32,256}$/.test(token)) throw new Error('OLNOO_CATALOG_TOKEN is missing or invalid')
  if (typeof basic !== 'string' || /[\x00-\x1f\x7f]/.test(basic) || basic.indexOf(':') < 1 || basic.length === basic.indexOf(':') + 1) throw new Error('OLNOO_CATALOG_BASIC_AUTH must contain a nonempty username:password without control characters')
  return { OLNOO_CATALOG_URL: 'https://admin.olnoo.com', OLNOO_CATALOG_TOKEN: token, OLNOO_CATALOG_BASIC_AUTH: basic }
}

/** This private file is loaded for both next build and next start, never through Next's `env`. */
export function loadCatalogDeployEnvironment(file) {
  let raw
  try { raw = readFileSync(file, 'utf8') } catch (error) { if (error.code === 'ENOENT') return; throw new Error('Cannot read catalog deploy environment') }
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || Object.keys(parsed).sort().join(',') !== 'OLNOO_CATALOG_BASIC_AUTH,OLNOO_CATALOG_TOKEN,OLNOO_CATALOG_URL' || parsed.OLNOO_CATALOG_URL !== 'https://admin.olnoo.com') throw new Error()
    Object.assign(process.env, catalogDeployEnvironment(parsed))
  } catch { throw new Error('Invalid catalog deploy environment') }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.stdout.write(`${JSON.stringify(catalogDeployEnvironment(process.env))}\n`) }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1 }
}
