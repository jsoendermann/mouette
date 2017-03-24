import * as Joi from 'joi'
import { flatten } from 'lodash'
const serialize = require('serialize-javascript')

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
  private static QUERY = (
    keyName: string,
    allowStringifiedDays: boolean,
    stringifiedDaysRegex: string,
  ) => {
    const norArray: any[] = [
      { [keyName]: { $type: 9 } }, // Date
      { [keyName]: { $type: 10 } }, // null
      { [keyName]: { $exists: false } },
    ]

    if (allowStringifiedDays) {
      norArray.push({ [keyName]: { $regex: new RegExp(stringifiedDaysRegex) } })
    }

    return ({ $nor: norArray })
  }

  private static metadata = {
    // TODO change name
    name: 'keys-that-en-in-at-should-contain-dates',
    prettyName: 'Keys that end in At should contain dates',
    description: 'Make sure columns with keys that end in ...At contain nothing but dates.',
    rationale: "It's what people expect when they see names like updatedAt.",
    // TODO fix types
    severity: 'error' as RuleSeverity,
    granularity: 'column' as RuleGranularity,
    isFuzzy: false,
    optionsDescription: `
      [allow-stringified-days]
        description = "Whether to allow dates that are saved as strings."
        type = "bool"
      [stringified-days-regex]
        description = "The regexp used to determine whether a string contains a date."
        type = "regexp"
    `,
    optionsSchema: {
      'allow-stringified-days': Joi.bool().required(),
      'stringified-days-regex': Joi.string().required(),
    },
  }

  public getMetadata() { return Rule.metadata }

  public async apply(dbWrapper: DbWrapper): Promise<IRuleFailure[]> {
    const collectionNames = await dbWrapper.getCollectionNames()

    // TODO use deepflatten here and everywhere else
    const failures: IRuleFailure[] = flatten(
      await Promise.all(collectionNames.map(async collectionName => {
        const keyNames = await dbWrapper.getKeysInCollection(collectionName)
        const keyNamesThatEndInAt = keyNames.filter(keyName => keyName.endsWith('At'))

        const failuresOrNull = await Promise.all(keyNamesThatEndInAt.map(async keyName => {
          const rawDb = await dbWrapper.getDb()
          const hasNonDateObjects = await rawDb
            .collection(collectionName)
            .count(Rule.QUERY(
              keyName,
              this.options['allow-stringified-days'],
              this.options['stringified-days-regex'],
            )) > 0

          if (hasNonDateObjects) {
            return new RuleFailure(
              this,
              collectionName,
              keyName,
            )
          }
          return null
        }))
        const failuresInCollection = failuresOrNull.filter(f => f) as IRuleFailure[]
        return failuresInCollection
      })),
    )
    return failures
  }

  public failureSpecificJson(failure: IRuleFailure): IRuleFailureSpecificJson {
    const collectionName = failure.getCollectionName() as string
    const keyName = failure.getKeyName() as string

    const allowStringifiedDays = this.options['allow-stringified-days']

    const mongoQuery = serialize(Rule.QUERY(
      keyName,
      allowStringifiedDays,
      this.options['stringified-days-regex'],
    ))

    const result: any = {
      failure: `Column **${collectionName}.${keyName
        }** ends in "At" but contains values that are not dates, null ${
        allowStringifiedDays ?
          ', undefined or satisfying the provided regexp.'
        : 'or undefined.'
      }`,
      mongoCommand: `db.getCollection('${collectionName}').find(${mongoQuery}, {${keyName}: 1})`,
    }

    return result
  }
}
