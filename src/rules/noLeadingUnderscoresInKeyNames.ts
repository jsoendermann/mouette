import { DbWrapper } from '../DbWrapper'
import { IRule, IRuleFailure, RuleFailure, IRuleFailureJson, RuleSeverity, RuleGranularity, AbstractRule } from '../rule'
import { isPlural, pluralize } from '../vendor/lingo'
import { flatten } from 'lodash'


export class Rule extends AbstractRule {
  public static metadata = {
    name: 'no-leading-underscores-in-key-names',
    prettyName: 'No leading underscores in key names',
    description: "Make sure no key name except _id starts with an underscore.",
    rationale: "It suggests the data is used internally.",
    severity: 'warning' as RuleSeverity,
    granularity: 'key_name' as RuleGranularity,
    isFuzzy: false,
  }

  async apply(db: DbWrapper): Promise<IRuleFailure[]> {
    const collectionNames = await db.getCollectionNames()
    const failures: IRuleFailure[] = flatten(
      await Promise.all(collectionNames.map(async collectionName => {
        const keyNames = await db.getKeysInCollection(collectionName)
        return keyNames
          .filter(keyName => keyName !== '_id' && keyName[0] === '_')
          .map(keyName => new RuleFailure(this, collectionName, keyName))
      }))
    )

    return failures
  }

  failureToJson(failure: IRuleFailure): IRuleFailureJson {
    const collectionName = failure.getCollectionName() as string
    const keyName = failure.getKeyName() as string

    const result: any = {
      ruleMetadata: Rule.metadata,
      location: {
        collectionName,
        keyName,
      },
      failure: `Key name **${collectionName}.${keyName}** should not start with an underscore.`,
    }

    if (keyName === '__v') {
      result.suggestion = "Configure mongoose so it doesn't create a __v key"
    }

    return result
  }
}
