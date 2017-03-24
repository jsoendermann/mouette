
import { flatten } from 'lodash'

import { DbWrapper } from '../DbWrapper'
import {
  AbstractRule,
  IRuleFailure,
  IRuleFailureSpecificJson,
  RuleFailure,
  RuleGranularity,
  RuleSeverity,
} from '../rule'


export class Rule extends AbstractRule {
  public static metadata = {
    name: 'no-leading-underscores-in-key-names',
    prettyName: 'No leading underscores in key names',
    description: 'Make sure no key name except _id starts with an underscore.',
    rationale: 'It suggests the data is used internally.',
    severity: 'warning' as RuleSeverity,
    granularity: 'key_name' as RuleGranularity,
    isFuzzy: false,
    optionsDescription: '',
    optionsSchema: {},
  }

  public getMetadata() { return Rule.metadata }

  public async apply(dbWrapper: DbWrapper): Promise<IRuleFailure[]> {
    const collectionNames = await dbWrapper.getCollectionNames()
    const failures: IRuleFailure[] = flatten(
      await Promise.all(collectionNames.map(async collectionName => {
        const keyNames = await dbWrapper.getKeysInCollection(collectionName)
        return keyNames
          .filter(keyName => keyName !== '_id' && keyName[0] === '_')
          .map(keyName => new RuleFailure(this, collectionName, keyName))
      })),
    )

    return failures
  }

  public failureSpecificJson(failure: IRuleFailure): IRuleFailureSpecificJson {
    const collectionName = failure.getCollectionName() as string
    const keyName = failure.getKeyName() as string

    const result: any = {
      failure: `Key name **${collectionName}.${keyName}** should not start with an underscore.`,
    }

    if (keyName === '__v') {
      result.suggestion = "Configure mongoose so it doesn't create a __v key"
    }

    return result
  }
}
