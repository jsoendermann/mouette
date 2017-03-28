const serialize = require('serialize-javascript')

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

  private static metadata = {
    name: 'keys-that-start-with-is-or-has-should-refer-to-booleans',
    prettyName: 'Keys that start with is or has should refer to booleans',
    description: 'Make sure columns with keys that start with is or has contain nothing but booleans.',
    rationale: "It's what people expect when they see names like isEmpty or hasChild.",
    granularity: RuleGranularity.Column,
    isFuzzy: false,
    optionsDescription: '',
    optionsSchema: {},
  }

  public getMetadata() { return Rule.metadata }

  public async getFailuresForCollectionAndKey(
    db: IDb,
    collectionName: string,
    keyName: string,
  ): Promise<RuleFailure | null> {
    if (!(keyName.startsWith('is') || keyName.startsWith('has'))) {
      return null
    }

    const hasNonBoolValues = await db.doesContainInCollection(
      collectionName,
      Rule.QUERY(
        keyName,
      ),
    )

    if (hasNonBoolValues) {
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

    const mongoQuery = serialize(Rule.QUERY(keyName))

    let startsWith: string
    if (keyName.startsWith('is')) {
      startsWith = 'is'
    } else if (keyName.startsWith('has')) {
      startsWith = 'has'
    } else {
      throw new Error(`Key ${collectionName}.${keyName
        } doesn't start with is or has but still generated a failure`)
    }
    const result: any = {
      failure: `Column **${collectionName}.${keyName
      }** starts with ${startsWith} but contains values that are not booleans, null or undefined`,
      mongoCommand: `db.getCollection('${collectionName}').find(${mongoQuery}, {${keyName}: 1})`,
    }

    return result
  }
}
