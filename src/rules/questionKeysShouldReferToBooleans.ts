const serialize = require('serialize-javascript')
import * as Joi from 'joi'

import { MongoType } from '../types'
import { IDb } from '../db'
import {
  AbstractKeyRule,
  IRuleFailureSpecificJson,
  RuleFailure,
  RuleGranularity,
} from '../rule'


export class Rule extends AbstractKeyRule {
  private static QUERY = (keyName: string) => {
    const norArray: any[] = [
      { [keyName]: { $type: 8 } }, // bool
      { [keyName]: { $type: 10 } }, // null
      { [keyName]: { $exists: false } },
    ]

    return ({ $nor: norArray })
  }

  public static metadata = {
    name: 'question-keys-should-refer-to-booleans',
    prettyName: 'Question keys should refer to booleans',
    description: 'Make sure columns with keys that start with verbs like "is" or "has" contain nothing but booleans.',
    rationale: "It's what people expect when they see names like isEmpty or hasChild.",
    granularity: RuleGranularity.Column,
    isFuzzy: false,
    optionsDescription: `
    [boolean-key-prefixes]
      description = "Which prefixes should indicate booleans."
      type = "string[]"
    `,
    optionsSchema: {
      'boolean-key-prefixes': Joi.array().items(
        Joi.string().alphanum().min(1),
      ).min(1).unique().required(),
    },
  }

  protected getMetadata() { return Rule.metadata }

  protected async getFailuresForCollectionAndKey(
    db: IDb,
    collectionName: string,
    keyName: string,
  ): Promise<RuleFailure[]> {
    const keyDoesStartWithPrefix = this
      .options['boolean-key-prefixes']
      .find((prefix: string) => keyName.startsWith(prefix)) !== undefined

    if (!keyDoesStartWithPrefix) {
      return []
    }

    const types = await db.getTypesOfKeyInCollection(collectionName, keyName)

    if (types.find((t: MongoType) => !(t === 'missing' || t === 'null' || t === 'boolean'))) {
      return [new RuleFailure(
        this,
        {
          collectionName,
          keyName,
        },
      )]
    }

    return []
  }

  public getFailureSpecificJson(failure: RuleFailure): IRuleFailureSpecificJson {
    const collectionName = failure.getCollectionName() as string
    const keyName = failure.getKeyName() as string

    const mongoQuery = serialize(Rule.QUERY(keyName))


    const keyPrefix = this
      .options['boolean-key-prefixes']
      .find((prefix: string) => keyName.startsWith(prefix))

    /* istanbul ignore if We wouldn't have gotten a failure if it wasn't in the list */
    if (!keyPrefix) {
      throw new Error(`Unknown key prefix: ${keyPrefix}`)
    }

    const result: any = {
      failure: `Column **${collectionName}.${keyName
      }** starts with "${keyPrefix}" but contains values that are not booleans, null or undefined`,
      mongoCommand: `db.getCollection('${collectionName}').find(${mongoQuery}, {${keyName}: 1})`,
    }

    return result
  }
}
