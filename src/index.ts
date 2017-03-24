import { readFileSync } from 'fs'
import * as humps from 'humps'
import { flatten } from 'lodash'
import { dirname, resolve } from 'path'
import { parse } from 'toml'

import { DbWrapper } from './DbWrapper'
import { commandLineFormatter } from './formatters'

import { AbstractRule } from './rule'

require('dotenv').config()


const dbWrapper = new DbWrapper(process.env.MONGO_URI)
const moduleFolder = dirname(module.filename)
const defaultConfigFileName = resolve(moduleFolder, '../defaultConfig.toml')
const defaultConfigFileContents = readFileSync(defaultConfigFileName, 'utf8')
const options = parse(defaultConfigFileContents);

(async () => {
  const rules: AbstractRule[] = []

  for (const ruleName of Object.keys(options)) {
    const { enabled, ...ruleOptions } = options[ruleName]
    if (enabled) {
      const fileName = `./rules/${humps.camelize(ruleName)}`
      const Rule = require(fileName).Rule
      const rule = new Rule(ruleOptions)
      rules.push(rule)
    }
  }

  const failures = flatten(
    await Promise.all(rules.map(r => r.apply(dbWrapper))),
  )

  const output = commandLineFormatter(failures.map(f => f.toJson()))
  console.log(output)
  dbWrapper.close()
})()
