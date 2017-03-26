import * as Joi from 'joi'
import { flatten } from 'lodash'
const serialize = require('serialize-javascript')

import { IDb } from '../db'
import {
  AbstractRule,
  IRuleFailureSpecificJson,
  RuleFailure,
  RuleSeverity,
  RuleGranularity,
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
    name: 'keys-that-en-in-at-should-refer-to-dates',
    prettyName: 'Keys that end in At should refer to dates',
    description: 'Make sure columns with keys that end in ...At contain nothing but dates.',
    rationale: "It's what people expect when they see names like updatedAt.",
    severity: RuleSeverity.Error,
    granularity: RuleGranularity.Column,
    isFuzzy: false,
    optionsDescription: `
      [allow-stringified-days]
        description = "Whether to allow dates that are saved as strings."
        type = "boolean"
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

  public async apply(db: IDb): Promise<RuleFailure[]> {
    const collectionNames = await db.getCollectionNames()

    const failuresForCollectionAndKey = async (collectionName: string, keyName: string) => {
      const hasNonDateObjects = await db.doesContainInCollection(
        collectionName,
        Rule.QUERY(
          keyName,
          this.options['allow-stringified-days'],
          this.options['stringified-days-regex'],
        ),
      )

      if (hasNonDateObjects) {
        return new RuleFailure(
          this,
          collectionName,
          keyName,
        )
      }
      return null
    }

    const failuresforCollection = async (collectionName: string) => {
      const keyNames = await db.getKeysInCollection(collectionName)
      const keyNamesThatEndInAt = keyNames.filter(keyName => keyName.endsWith('At'))

      const failuresOrNull = await Promise.all(
        keyNamesThatEndInAt.map(keyName => failuresForCollectionAndKey(collectionName, keyName)),
      )
      const failuresInCollection = failuresOrNull.filter(f => f) as RuleFailure[]
      return failuresInCollection
    }

    const failures: RuleFailure[] = flatten(
      await Promise.all(collectionNames.map(failuresforCollection)),
    )
    return failures
  }

  public failureSpecificJson(failure: RuleFailure): IRuleFailureSpecificJson {
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
