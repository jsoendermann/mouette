import { flatten } from 'lodash'

import { DbWrapper } from '../DbWrapper'
import { AbstractRule, IRuleFailure, IRuleFailureJson, RuleFailure,  RuleGranularity, RuleSeverity } from '../rule'


export class Rule extends AbstractRule {
  public static metadata = {
    name: 'keys-that-en-in-at-should-contain-dates',
    prettyName: 'Keys that end in At should contain dates',
    description: 'Make sure columns with keys that end in ...At contain nothing but dates.',
    rationale: "It's what people expect when they see names like updatedAt.",
    severity: 'error' as RuleSeverity,
    granularity: 'column' as RuleGranularity,
    isFuzzy: false,
  }

  public async apply(db: DbWrapper): Promise<IRuleFailure[]> {
    const collectionNames = await db.getCollectionNames()

    const failures: IRuleFailure[] = flatten(
      await Promise.all(collectionNames.map(async collectionName => {
        const keyNames = await db.getKeysInCollection(collectionName)
        const keyNamesThatEndInAt = keyNames.filter(keyName => keyName.endsWith('At'))

        const failuresOrNull = await Promise.all(keyNamesThatEndInAt.map(async keyName => {
          const rawDb = await db.getDb()
          const hasNonDateObjects = await rawDb.collection(collectionName).count(
            {
              $nor: [
                { [keyName]: { $type: 9 } }, // Date
                { [keyName]: { $type: 10 } }, // null
                { [keyName]: { $exists: false } },
              ]
            }
          ) > 0

          if (hasNonDateObjects) {
            return new RuleFailure(
              this,
              collectionName,
              keyName
            )
          }
          return null
        }))
        const failuresInCollection = failuresOrNull.filter(f => f) as IRuleFailure[]
        return failuresInCollection
      }))
    )
    return failures
  }

  public failureToJson(failure: IRuleFailure): IRuleFailureJson {
    const collectionName = failure.getCollectionName() as string
    const keyName = failure.getKeyName() as string

    const result: any = {
      ruleMetadata: Rule.metadata,
      location: {
        collectionName,
        keyName,
      },
      failure: `Column **${collectionName}.${keyName}** contains values that are not dates, null or non-existant.`,
      mongoCommand: `
db.${collectionName}.find({
  $nor: [
    {${keyName}: {$type: 9}},
    {${keyName}: {$type: 10}},
    {${keyName}: {$exists: false}}
  ]
}, {${keyName}: 1})`.trim(),
    }

    return result
  }
}
