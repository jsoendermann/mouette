const serialize = require('serialize-javascript')

import { IDb } from '../db'
import {
  AbstractKeyRule,
  IRuleFailureSpecificJson,
  RuleFailure,
  RuleGranularity,
} from '../rule'


export class Rule extends AbstractKeyRule {
  private static QUERY = (keyName: string) => ({ [keyName]: { $exists: false } })

  public static metadata = {
    name: 'no-undefined',
    prettyName: 'No undefined',
    description: 'Make sure columns do not contain undefined values.',
    rationale: "It's efficient because the record doesn't have to grow later.",
    granularity: RuleGranularity.Column,
    isFuzzy: false,
    optionsDescription: '',
    optionsSchema: {},
  }

  protected getMetadata() { return Rule.metadata }

  protected async getFailuresForCollectionAndKey(
    db: IDb,
    collectionName: string,
    keyName: string,
  ): Promise<RuleFailure[]> {
    const hasUndefinedValues = await db.doesContainInCollection(
      collectionName, Rule.QUERY(keyName),
    )

    if (hasUndefinedValues) {
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
      failure: `Column **${collectionName}.${keyName}** contains undefined values.`,
      mongoCommand: `db.getCollection('${collectionName}').find(${mongoQuery})`,
    }

    return result
  }
}
