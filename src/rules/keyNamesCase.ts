import * as Joi from 'joi'
const to = require('to-case')

import { IDb } from '../db'
import {
  AbstractKeyRule,
  IRuleFailureSpecificJson,
  RuleFailure,
  RuleGranularity,
  RuleSeverity,
} from '../rule'


export class Rule extends AbstractKeyRule {
  public static metadata = {
    name: 'key-names-case',
    prettyName: 'Key names case',
    description: 'Make sure all keys in the database have the right case.',
    rationale: 'Reads more fluently.',
    severity: RuleSeverity.Warning,
    granularity: RuleGranularity.KeyName,
    isFuzzy: false,
    optionsDescription: `
      [format]
        description = "The case your keys should be in."
        type = "enum"
        possibleValues = "'camel' | 'snake'"
    `,
    optionsSchema: {
      case: Joi.any().allow(['camel', 'snake']).required(),
    },
  }

  public getMetadata() { return Rule.metadata }

  public async getFailuresForCollectionAndKey(
    db: IDb,
    collectionName: string,
    keyName: string,
  ): Promise<RuleFailure | null> {
    if (/^_*[a-z]+$/.test(keyName)) {
      // Single words don't have a case
      return null
    }

    const keyCase = to(keyName) as string

    switch (keyCase) {
      case 'camel':
      case 'snake':
        if (this.options.case !== keyCase) {
          return new RuleFailure(this, collectionName, keyName)
        }
        return null
      default: return new RuleFailure(this, collectionName, keyName)
    }
  }

  public getFailureSpecificJson(failure: RuleFailure): IRuleFailureSpecificJson {
    const collectionName = failure.getCollectionName() as string
    const keyName = failure.getKeyName() as string

    const keyCase = this.options.case as string

    switch (keyCase) {
      case 'camel':
      case 'snake':
        return {
          failure: `Key name **${collectionName}.${keyName}** is not in ${keyCase} case.`,
          suggestion: `Change *${collectionName}.${keyName}* to *${collectionName}.${to[keyCase](keyName)}*.`,
        }
      default: throw new Error(`Options value ${keyCase
        } provided as 'case' to key-names-case not valid`)
    }
  }
}
