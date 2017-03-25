import * as colors from 'colors'
import { IRuleFailureJson } from '../rule'


export default (failures: IRuleFailureJson[]): string => {
  return failures.map(formatFailure).join('\n\n')
}

const formatFailure = (failure: IRuleFailureJson): string => {
  let color: (s: string) => string
  let bgColor: (s: string) => string
  switch (failure.ruleMetadata.severity) {
    case 'Warning':
      color = colors.yellow
      bgColor = colors.bgYellow
      break
    case 'Error':
      color = colors.red
      bgColor = colors.bgRed
      break
    default: throw new Error('Switch must be exhaustive')
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
