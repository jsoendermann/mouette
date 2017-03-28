import * as Joi from 'joi'
const serialize = require('serialize-javascript')

import { IDb } from '../db'
import {
  AbstractKeyRule,
  IRuleFailureSpecificJson,
  RuleFailure,
  RuleSeverity,
  RuleGranularity,
} from '../rule'


export class Rule extends AbstractKeyRule {
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
    name: 'keys-that-end-in-at-should-refer-to-dates',
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

  public async getFailuresForCollectionAndKey(
    db: IDb,
    collectionName: string,
    keyName: string,
  ): Promise<RuleFailure | null> {
    if (!keyName.endsWith('At')) {
      return null
    }
    const hasNonDateValues = await db.doesContainInCollection(
      collectionName,
      Rule.QUERY(
        keyName,
        this.options['allow-stringified-days'],
        this.options['stringified-days-regex'],
      ),
    )

    if (hasNonDateValues) {
      return new RuleFailure(
        this,
        {
          collectionName,
          keyName,
        },
      )
    }
    return null
  }

  public getFailureSpecificJson(failure: RuleFailure): IRuleFailureSpecificJson {
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
      }** ends in "At" but contains values that are not dates, null${
      allowStringifiedDays ?
        ', undefined or satisfying the provided regexp.'
        : ' or undefined.'
      }`,
      mongoCommand: `db.getCollection('${collectionName}').find(${mongoQuery}, {${keyName}: 1})`,
    }

    return result
  }
}
