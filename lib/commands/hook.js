const hookApi = require('libnpmhook')
const otplease = require('../utils/otplease.js')
const relativeDate = require('tiny-relative-date')
const Table = require('cli-table3')
const { output } = require('proc-log')

const BaseCommand = require('../base-command.js')
class Hook extends BaseCommand {
  static description = 'Manage registry hooks'
  static name = 'hook'
  static params = [
    'registry',
    'otp',
  ]

  static usage = [
    'add <pkg> <url> <secret> [--type=<type>]',
    'ls [pkg]',
    'rm <id>',
    'update <id> <url> <secret>',
  ]

  async exec (args) {
    return otplease(this.npm, { ...this.npm.flatOptions }, (opts) => {
      switch (args[0]) {
        case 'add':
          return this.add(args[1], args[2], args[3], opts)
        case 'ls':
          return this.ls(args[1], opts)
        case 'rm':
          return this.rm(args[1], opts)
        case 'update':
        case 'up':
          return this.update(args[1], args[2], args[3], opts)
        default:
          throw this.usageError()
      }
    })
  }

  async add (pkg, uri, secret, opts) {
    const hook = await hookApi.add(pkg, uri, secret, opts)
    if (opts.json) {
      output.standard(JSON.stringify(hook, null, 2))
    } else if (opts.parseable) {
      output.standard(Object.keys(hook).join('\t'))
      output.standard(Object.keys(hook).map(k => hook[k]).join('\t'))
    } else if (!this.npm.silent) {
      output.standard(`+ ${this.hookName(hook)} ${opts.unicode ? ' ➜ ' : ' -> '} ${hook.endpoint}`)
    }
  }

  async ls (pkg, opts) {
    const hooks = await hookApi.ls({ ...opts, package: pkg })
    if (opts.json) {
      output.standard(JSON.stringify(hooks, null, 2))
    } else if (opts.parseable) {
      output.standard(Object.keys(hooks[0]).join('\t'))
      hooks.forEach(hook => {
        output.standard(Object.keys(hook).map(k => hook[k]).join('\t'))
      })
    } else if (!hooks.length) {
      output.standard("You don't have any hooks configured yet.")
    } else if (!this.npm.silent) {
      if (hooks.length === 1) {
        output.standard('You have one hook configured.')
      } else {
        output.standard(`You have ${hooks.length} hooks configured.`)
      }

      const table = new Table({ head: ['id', 'target', 'endpoint'] })
      hooks.forEach((hook) => {
        table.push([
          { rowSpan: 2, content: hook.id },
          this.hookName(hook),
          hook.endpoint,
        ])
        if (hook.last_delivery) {
          table.push([
            {
              colSpan: 1,
              content: `triggered ${relativeDate(hook.last_delivery)}`,
            },
            hook.response_code,
          ])
        } else {
          table.push([{ colSpan: 2, content: 'never triggered' }])
        }
      })
      output.standard(table.toString())
    }
  }

  async rm (id, opts) {
    const hook = await hookApi.rm(id, opts)
    if (opts.json) {
      output.standard(JSON.stringify(hook, null, 2))
    } else if (opts.parseable) {
      output.standard(Object.keys(hook).join('\t'))
      output.standard(Object.keys(hook).map(k => hook[k]).join('\t'))
    } else if (!this.npm.silent) {
      output.standard(`- ${this.hookName(hook)} ${opts.unicode ? ' ✘ ' : ' X '} ${hook.endpoint}`)
    }
  }

  async update (id, uri, secret, opts) {
    const hook = await hookApi.update(id, uri, secret, opts)
    if (opts.json) {
      output.standard(JSON.stringify(hook, null, 2))
    } else if (opts.parseable) {
      output.standard(Object.keys(hook).join('\t'))
      output.standard(Object.keys(hook).map(k => hook[k]).join('\t'))
    } else if (!this.npm.silent) {
      output.standard(`+ ${this.hookName(hook)} ${opts.unicode ? ' ➜ ' : ' -> '} ${hook.endpoint}`)
    }
  }

  hookName (hook) {
    let target = hook.name
    if (hook.type === 'owner') {
      target = '~' + target
    }
    return target
  }
}
module.exports = Hook
