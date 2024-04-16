const { run, npm } = require('./util.js')

const ALLOWED_LICENSES = new Set([
  'Apache 2.0',
  'Apache-2.0',
  'Artistic-2.0',
  'BlueOak-1.0.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'CC-BY-3.0',
  'CC0-1.0',
  'ISC',
  'MIT',
])

const main = async () => {
  const errors = []

  for (const dep of await npm.query('*.prod')) {
    const license = Array.isArray(dep.licenses) ? dep.licenses[0] : dep.license
    const licenseString = license?.type ?? license
    if (!ALLOWED_LICENSES.has(licenseString)) {
      errors.push(`${dep.pkgid} in ${dep.location} has an invalid license ${licenseString}`)
    }
  }

  if (errors.length) {
    throw new Error(`License errors: ${errors.join('\n')}`)
  }

  return 'ok'
}

run(main)
