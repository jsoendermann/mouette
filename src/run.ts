import { readFileSync } from 'fs'
import * as humps from 'humps'
import { merge, flatten } from 'lodash'
import { dirname, resolve } from 'path'
import { parse } from 'toml'

import { DbWrapper } from './DbWrapper'

import { IRuleFailureJson, AbstractRule } from './rule'


export const run = async (mongoUri: string, userConfig: any = {}): Promise<IRuleFailureJson[]> => {
  const dbWrapper = new DbWrapper(mongoUri)

  const moduleFolder = dirname(module.filename)
  const defaultConfigFileName = resolve(moduleFolder, '../defaultConfig.toml')
  const defaultConfigFileContents = readFileSync(defaultConfigFileName, 'utf8')
  const defaultConfig = parse(defaultConfigFileContents)

  const config = merge(defaultConfig, userConfig)

  const rules: AbstractRule[] = []

  for (const ruleName of Object.keys(config)) {
    const { enabled, ...ruleOptions } = config[ruleName]
    if (enabled) {
      const fileName = `./rules/${humps.camelize(ruleName)}`
      const Rule = require(fileName).Rule
      const rule = new Rule(ruleOptions)
      rules.push(rule)
    }
  }

  const failures = flatten(await Promise.all(rules.map(r => r.apply(dbWrapper))))
  const failuresJson = failures.map(f => f.toJson())
  dbWrapper.close()
  return failuresJson
}
