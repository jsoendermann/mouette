import { differenceBy } from 'lodash'

import { IRuleFailureJson } from './rule'


export const diff = (
  lintResultsOld: IRuleFailureJson[],
  lintResultsNew: IRuleFailureJson[],
): IRuleFailureJson[] => {
  return differenceBy(
    lintResultsNew,
    lintResultsOld,
    (a: IRuleFailureJson) => `${
      a.ruleMetadata.name}.${
      a.location.collectionName}.${
      a.location.keyName}`,
  )
}
