import * as Joi from 'joi'

import { IDb } from '../db'
import {
  AbstractCollectionRule,
  IRuleFailureSpecificJson,
  RuleFailure,
  RuleGranularity,
} from '../rule'


export class Rule extends AbstractCollectionRule {
  public static metadata = {
    name: 'max-key-count',
    prettyName: 'Max key count',
    description: 'Enforces a maximum number of keys per collection.',
    rationale: 'Hierarchical objects are more readable and faster to scan without index.',
    granularity: RuleGranularity.CollectionName,
    isFuzzy: false,
    optionsDescription: `
      [maximum-excluding-_id]
        description = "The maximum number of keys allowed."
        type = "number"
    `,
    optionsSchema: {
      'maximum-excluding-_id': Joi.number().required(),
    },
  }

  public getMetadata() { return Rule.metadata }

  public async getFailuresForCollection(
    db: IDb,
    collectionName: string,
  ): Promise<RuleFailure | null> {
    const keys = await db.getKeysInCollection(collectionName)
    const keysWithoutId = keys.filter(k => k !== '_id')
    const actualKeyCount = keysWithoutId.length
    if (actualKeyCount > this.options['maximum-excluding-_id']) {
      return new RuleFailure(
        this,
        {
          collectionName,
          additionalDetails: { actualKeyCount },
        },
      )
    }
    return null
  }

  public getFailureSpecificJson(failure: RuleFailure): IRuleFailureSpecificJson {
    const collectionName = failure.getCollectionName() as string
    const { actualKeyCount } = failure.getAdditionalDetails()

    return {
      failure: `Collection **${collectionName}** has ${actualKeyCount
        } keys which exceeds the allowed maximum of ${this.options['maximum-excluding-_id']}`,
    }
  }
}
