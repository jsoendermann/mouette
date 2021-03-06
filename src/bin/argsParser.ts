import { ArgumentParser } from 'argparse'

const packageJson = require('../../package.json')


const parser = new ArgumentParser({
  version: packageJson.version,
  addHelp: true,
  description: 'Mouette command line interface',
})

const subparsers = parser.addSubparsers({
  title: 'subcommands',
  dest: 'subcommand',
})

const lintParser = subparsers.addParser('lint', {
  description: 'Lints your database and writes the result to stdout.',
  addHelp: true,
})
lintParser.addArgument(
  ['-c', '--config-file'],
  {
    required: false,
    help: "The path to a .json/.yaml/.toml file containing your configuration. \
If this flag is not set, mouette looks for a mouette.{json,yaml,toml} file in the current directory. \
If it can't find one, the default configuration is used.",
  },
)
lintParser.addArgument(
  ['-s', '--output-style'],
  {
    required: false,
    help: 'The style of the output that is written to stdout. Defaults to `full`.',
    choices: ['json', 'full', 'summary'],
    defaultValue: 'full',
  },
)
lintParser.addArgument(['MONGO_URI'], { help: 'The URI to your Mongo database.' })

const diffParser = subparsers.addParser('diff', { addHelp: true })
diffParser.addArgument(
  ['-s', '--output-style'],
  {
    required: false,
    help: 'The style of the output that is written to stdout. Defaults to `full`.',
    choices: ['json', 'full', 'summary'],
    defaultValue: 'full',
  },
)
diffParser.addArgument(['LINT_RESULTS_OLD'], {
  help: 'The path to the older of the two lint results. Must be a .json/.yaml/.toml file.',
})
diffParser.addArgument(['LINT_RESULTS_NEW'], {
  help: 'The path to the newer of the two lint results. Must be a .json/.yaml/.toml file.',
})

export default parser.parseArgs()
