import * as colors from 'colors'
import { IRuleFailureJson } from '../rule'


export default (failures: IRuleFailureJson[]): string => {
  const warnings = failures.filter(failure => failure.options.severity === 'warning')
  const errors = failures.filter(failure => failure.options.severity === 'error')

  return warnings.map(formatFailure).join('\n\n') +
    '\n\n' +
    errors.map(formatFailure).join('\n\n')
}

const formatFailure = (failure: IRuleFailureJson): string => {
  let color: (s: string) => string
  let bgColor: (s: string) => string
  switch (failure.options.severity) {
    case 'warning':
      color = colors.yellow
      bgColor = colors.bgYellow
      break
    case 'error':
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
    output += colors.gray(`\nTo see the offending records run: ${colors.cyan(failure.mongoCommand)}`)
  }
  return output
}
