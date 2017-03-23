import * as colors from 'colors'
import { IRuleFailureJson } from '../rule'
import { formatter } from './formatter'


export const commandLineFormatter: formatter = (failures: IRuleFailureJson[]): string => {
  return failures.map(formatFailure).join('\n\n')
}

const formatFailure = (failure: IRuleFailureJson): string => {
  let color = (s: string) => s, bgColor = (s: string) => s
  switch (failure.ruleMetadata.severity) {
    case 'warning':
      color = colors.yellow
      bgColor = colors.bgYellow
      break;
    case 'error':
      color = colors.red
      bgColor = colors.bgRed
      break;
  }

  let output = `${failure.failure.replace(/\*\*(.*?)\*\*/g, color('$1'))}`
  if (failure.suggestion) {
    output += colors.gray(`\nYou could... ${failure.suggestion.replace(/\*(.*?)\*/g, colors.white('$1'))}`)
  }
  if (failure.mongoCommand) {
    output += colors.gray(`\nTo see the offending records run:\n${colors.cyan(failure.mongoCommand)}`)
  }
  return output
}