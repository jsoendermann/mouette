import { IRuleFailureJson } from './rule'

export const diff = async (
  lintResultsOld: IRuleFailureJson[],
  lintResultsNew: IRuleFailureJson[]
): Promise<IRuleFailureJson[]> => {
  throw new Error('Not yet implemented')
}
