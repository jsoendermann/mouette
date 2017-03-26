import { readFileSync } from 'fs'
import * as humps from 'humps'
import { merge, flatten } from 'lodash'
import { dirname, resolve } from 'path'
import { parse } from 'toml'

import { MongoDbWrapper } from './db'
import { IRuleFailureJson, AbstractRule } from './rule'


export const run = async (mongoUri: string, userConfig: any = {}): Promise<IRuleFailureJson[]> => {
  const db = new MongoDbWrapper(mongoUri)

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

  const failures = flatten(await Promise.all(rules.map(r => r.apply(db))))
  const failuresJson = failures.map(f => f.toJson())
  db.close()
  return failuresJson
}
