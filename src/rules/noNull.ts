const serialize = require('serialize-javascript')

import { IDb } from '../db'
import {
  AbstractKeyRule,
  IRuleFailureSpecificJson,
  RuleFailure,
  RuleGranularity,
} from '../rule'


export class Rule extends AbstractKeyRule {
  private static QUERY = (keyName: string) => ({ [keyName]: { $type: 10 } })

  private static metadata = {
    name: 'no-null',
    prettyName: 'No null',
    description: 'Make sure columns do not contain null values.',
    rationale: 'Some columns should not be nullable.',
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
  ): Promise<RuleFailure[]> {
    const hasNullValues = await db.doesContainInCollection(
      collectionName, Rule.QUERY(keyName),
    )

    if (hasNullValues) {
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

    const result: any = {
      failure: `Column **${collectionName}.${keyName}** contains null values.`,
      mongoCommand: `db.getCollection('${collectionName}').find(${mongoQuery},{${keyName}:1})`,
    }

    return result
  }
}
