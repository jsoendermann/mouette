import { groupBy } from 'lodash'
import { IRuleFailureJson } from '../rule'
import * as colors from 'colors'
const Table = require('cli-table2')

type colorize = (s: string) => string

export default (failures: IRuleFailureJson[]): string => {
  const table = new Table({
    head: [colors.white('Rule'), colors.white('Count'), colors.white('Locations')],
    colWidths: [Math.max(...failures.map(f => f.ruleMetadata.prettyName.length)) + 5, 'Count'.length + 2, 100],
    wordWrap: true,
  })

  const warnings = failures.filter(failure => failure.options.severity === 'warning')
  const errors = failures.filter(failure => failure.options.severity === 'error')

  table.push(...convertToTableRow(warnings, colors.yellow))
  table.push(...convertToTableRow(errors, colors.red))

  return table.toString()
}

const convertToTableRow = (failures: IRuleFailureJson[], clr: colorize): string [][] => {
  const groupedFailures = groupBy(failures, (f: IRuleFailureJson) => f.ruleMetadata.prettyName)
  const sortedPrettyRuleNames = Object.keys(groupedFailures).sort()

  return sortedPrettyRuleNames.map(prettyRuleName => {
    const ruleFailures = groupedFailures[prettyRuleName]
    const locations = groupedFailures[prettyRuleName].map(f =>
      f.location.collectionName + (f.location.keyName ? `.${f.location.keyName}` : ''),
    ).join(', ')
    return [clr(prettyRuleName), String(ruleFailures.length), locations]
  })
}
