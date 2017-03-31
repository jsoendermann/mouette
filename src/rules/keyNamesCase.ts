import * as Joi from 'joi'
const to = require('to-case')

import { IDb } from '../db'
import {
  AbstractKeyRule,
  IRuleFailureSpecificJson,
  RuleFailure,
  RuleGranularity,
} from '../rule'


export class Rule extends AbstractKeyRule {
  public static metadata = {
    name: 'key-names-case',
    prettyName: 'Key names case',
    description: 'Make sure all keys in the database have the right case.',
    rationale: 'Reads more fluently.',
    granularity: RuleGranularity.KeyName,
    isFuzzy: false,
    optionsDescription: `
      [case]
        description = "The case your keys should be in."
        type = "enum"
        possibleValues = "'camel' | 'snake'"
    `,
    optionsSchema: {
      case: Joi.any().allow(['camel', 'snake']).required(),
    },
  }

  protected getMetadata() { return Rule.metadata }

  protected async getFailuresForCollectionAndKey(
    db: IDb,
    collectionName: string,
    keyName: string,
  ): Promise<RuleFailure[]> {
    if (/^_*[a-z]+$/.test(keyName)) {
      // Single words don't have a case
      return []
    }

    const actualKeyCase = to(keyName) as string

    switch (actualKeyCase) {
      case 'camel':
      case 'snake':
        if (this.options.case !== actualKeyCase) {
          return [new RuleFailure(this, { collectionName, keyName })]
        }
        return []
      default: return [new RuleFailure(this, { collectionName, keyName })]
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
      /* istanbul ignore next Joi makes sure this can't happen */
      default: throw new Error(`Unknown case: ${keyCase}`)
    }
  }
}
