import { extname } from 'path'
import { existsSync, readFileSync } from 'fs'
import { load as parseYaml } from 'js-yaml'
import { parse as parseToml } from 'toml'

import args from './argsParser'
import { run } from '..'
import commandLineFormatter from './commandLineFormatter'


const loadConfigFileAtPath = (configFilePath: string): any | null => {
  if (!existsSync(configFilePath)) {
    return null
  }

  const configFileContent = readFileSync(configFilePath, 'utf8')

  const configFilePathExtension = extname(configFilePath)
  switch (configFilePathExtension) {
    case '.json': return JSON.parse(configFileContent)
    case '.yml':
    case '.yaml': return parseYaml(configFileContent)
    case '.toml': return parseToml(configFileContent)
    default: throw new Error(`Unrecognized config file extension: ${configFilePathExtension}.`)
  }
}

const getUserConfig = (userConfigFilePath: string | null): any => {
  if (userConfigFilePath !== null) {
    const userConfig = loadConfigFileAtPath(userConfigFilePath)
    if (userConfig === null) {
      throw new Error(`Cannot load config file at ${userConfigFilePath}`)
    }
    return userConfig
  }

  return loadConfigFileAtPath('./mouette.json') ||
    loadConfigFileAtPath('./mouette.yaml') ||
    loadConfigFileAtPath('./mouette.yml') ||
    loadConfigFileAtPath('./mouette.toml') || {}
}

const runCommand = async (args: any) => {
  const userConfig = getUserConfig(args.config_file)
  const lintResults = await run(args.MONGO_URI, userConfig)

  switch (args.output_style) {
    case 'json':
      console.log(JSON.stringify(lintResults))
      return
    case 'terminal':
      console.log(commandLineFormatter(lintResults))
      return
    default: throw new Error(`Unrecognized output style: ${args.output_style}`)
  }
}

const diffCommand = async (args: any) => {
  // TODO
  throw new Error('The diff subcommand has not yet been implemented.')
}

export default async () => {
  try {
    switch (args.subcommand) {
      case 'run':
        await runCommand(args)
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
