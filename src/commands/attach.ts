import {Command, flags} from '@oclif/command'

class Attach extends Command {
  static description = 'Attach to a node'

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    endpoint: flags.string({char: 'e', description: 'Node endpoint to attach'}),
  }

  static args = []

  async run() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {args, flags} = this.parse(Attach)

    const endpoint = flags.endpoint || 'http://localhost:3109'

    const repl = require('repl')
    const vm = require('vm')
    const {Sdk, JsonRpcClient} = require('wingchain-sdk')

    const {processTopLevelAwait} = require('node-repl-await')

    function isRecoverableError(error: any) {
      if (error.name === 'SyntaxError') {
        return /^(Unexpected end of input|Unexpected token)/.test(
          error.message,
        )
      }
      return false
    }

    async function customEval(code: any, context: any, filename: any, callback: any) {
      code = processTopLevelAwait(code) || code

      try {
        const result = await vm.runInNewContext(code, context)
        callback(null, result)
      } catch (error) {
        if (isRecoverableError(error)) {
          callback(new repl.Recoverable(error))
        } else {
          console.log(error)
        }
      }
    }

    const client = new JsonRpcClient(endpoint)
    const sdk = new Sdk(client)

    const c = repl.start({prompt: 'wingchain-cli> ', eval: customEval}).context
    c.util.inspect.defaultOptions.depth = null
    c.sdk = sdk
  }
}

export = Attach
