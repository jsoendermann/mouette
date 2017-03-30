import * as Joi from 'joi'

import { IDb } from '../db'
import {
  AbstractKeyRule,
  IRuleFailureSpecificJson,
  RuleFailure,
  RuleGranularity,
} from '../rule'


export class Rule extends AbstractKeyRule {
  public static metadata = {
    name: 'no-bad-key-names',
    prettyName: 'No bad key names',
    description: 'Make sure no common bad key names are used.',
    rationale: "Bad key names don't give you any information about what's saved in the column.",
    granularity: RuleGranularity.KeyName,
    isFuzzy: false,
    optionsDescription: `
      [names-considered-bad]
        description = "Key names that should be avoided."
        type = "string[]"
    `,
    optionsSchema: {
      'names-considered-bad': Joi.array().items(Joi.string().alphanum().min(1)).min(1).required(),
    },
  }

  protected getMetadata() { return Rule.metadata }

  protected async getFailuresForCollectionAndKey(
    db: IDb,
    collectionName: string,
    keyName: string,
  ): Promise<RuleFailure[]> {
    if (this.options['names-considered-bad'].includes(keyName)) {
      return [new RuleFailure(this, { collectionName, keyName })]
    }
    return []
  }

  public getFailureSpecificJson(failure: RuleFailure): IRuleFailureSpecificJson {
    const collectionName = failure.getCollectionName() as string
    const keyName = failure.getKeyName() as string

    return {
      failure: `Collection ${collectionName} contains a key named **${
        keyName}** which is not a good name.`,
    }
  }
}
