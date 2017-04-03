import { readFileSync } from 'fs'
import * as humps from 'humps'
import { dirname, resolve } from 'path'
import { parse } from 'toml'


const moduleFolder = dirname(module.filename)
const defaultConfigFileName = resolve(moduleFolder, '../../defaultConfig.toml')
const defaultConfigFileContents = readFileSync(defaultConfigFileName, 'utf8')
const defaultConfig = parse(defaultConfigFileContents)

Object.keys(defaultConfig).forEach(ruleName => {
  const ruleFileName = resolve(`${dirname(module.filename)}/../rules/${humps.camelize(ruleName)}`)
  const { Rule } = require(ruleFileName)
  const metadata = Rule.metadata
  console.log(`- [${defaultConfig[ruleName].enabled ? 'X' : ' '}] **${metadata.prettyName}**: ${metadata.description}`)
  const options = parse(metadata.optionsDescription)
  Object.keys(options).forEach(optionDescription => {
    console.log(`  * *${optionDescription}*: ${options[optionDescription].description}`)
  })
})
