import { extname } from 'path'
import { existsSync, readFileSync } from 'fs'
import { load as parseYaml } from 'js-yaml'
import { parse as parseToml } from 'toml'

import args from './argsParser'
import { lint, diff, IRuleFailureJson } from '..'
import commandLineFormatter from './commandLineFormatter'
import summaryCommandLineFormatter from './summaryCommandLineFormatter'


const loadSerializedData = (filePath: string): any | null => {
  if (!existsSync(filePath)) {
    return null
  }

  const configFileContent = readFileSync(filePath, 'utf8')

  const filePathExtension = extname(filePath)
  switch (filePathExtension) {
    case '.json': return JSON.parse(configFileContent)
    case '.yml':
    case '.yaml': return parseYaml(configFileContent)
    case '.toml': return parseToml(configFileContent)
    default: throw new Error(`Unrecognized config file extension: ${filePathExtension}.`)
  }
}

const getUserConfig = (userConfigFilePath: string | null): any => {
  if (userConfigFilePath !== null) {
    const userConfig = loadSerializedData(userConfigFilePath)
    if (userConfig === null) {
      throw new Error(`Cannot load config file at ${userConfigFilePath}`)
    }
    return userConfig
  }

  return loadSerializedData('./mouette.json') ||
    loadSerializedData('./mouette.yaml') ||
    loadSerializedData('./mouette.yml') ||
    loadSerializedData('./mouette.toml') || {}
}

const logFailures = (failures: IRuleFailureJson[], style: string) => {
  switch (style) {
    case 'json':
      console.log(JSON.stringify(failures))
      return
    case 'full':
      console.log(commandLineFormatter(failures))
      return
    case 'summary':
      console.log(summaryCommandLineFormatter(failures))
      return
    default: throw new Error(`Unrecognized output style: ${args.output_style}`)
  }
}

const lintCommand = async (args: any) => {
  const userConfig = getUserConfig(args.config_file)
  const lintResults = await lint(args.MONGO_URI, userConfig)

  logFailures(lintResults, args.output_style)
}

const diffCommand = async (args: any) => {
  const lintResultsOld = loadSerializedData(args.LINT_RESULTS_OLD)
  const lintResultsNew = loadSerializedData(args.LINT_RESULTS_NEW)

  const difference = diff(lintResultsOld, lintResultsNew)

  logFailures(difference, args.output_style)
}

export default async () => {
  try {
    switch (args.subcommand) {
      case 'lint':
        await lintCommand(args)
        break
      case 'diff':
        diffCommand(args)
        break
      default: throw new Error(`Unrecognized subcommand: ${args.subcommand}`)
    }
  } catch (e) {
    console.error(e)
    process.exit(-1)
  }
}
