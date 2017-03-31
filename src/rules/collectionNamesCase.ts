import * as Joi from 'joi'
const to = require('to-case')

import { IDb } from '../db'
import {
  AbstractCollectionRule,
  IRuleFailureSpecificJson,
  RuleFailure,
  RuleGranularity,
} from '../rule'


export class Rule extends AbstractCollectionRule {
  public static metadata = {
    name: 'collection-names-case',
    prettyName: 'Collection names case',
    description: 'Make sure all collection names in the database have the right case.',
    rationale: 'Reads more fluently.',
    granularity: RuleGranularity.CollectionName,
    isFuzzy: false,
    optionsDescription: `
      [case]
        description = "The case your collection names should be in."
        type = "enum"
        possibleValues = "'camel' | 'snake'"
    `,
    optionsSchema: {
      case: Joi.any().allow(['camel', 'snake']).required(),
    },
  }

  protected getMetadata() { return Rule.metadata }

  protected async getFailuresForCollection(
    db: IDb,
    collectionName: string,
  ): Promise<RuleFailure[]> {
    if (/^_*[a-z]+$/.test(collectionName)) {
      // Single words don't have a case
      return []
    }

    const actualCollectionNameCase = to(collectionName) as string

    switch (actualCollectionNameCase) {
      case 'camel':
      case 'snake':
        if (this.options.case !== actualCollectionNameCase) {
          return [new RuleFailure(this, { collectionName })]
        }
        return []
      default: return [new RuleFailure(this, { collectionName })]
    }
  }

  public getFailureSpecificJson(failure: RuleFailure): IRuleFailureSpecificJson {
    const collectionName = failure.getCollectionName() as string

    const collectionNameCase = this.options.case as string

    switch (collectionNameCase) {
      case 'camel':
      case 'snake':
        return {
          failure: `Collection name **${collectionName}** is not in ${collectionNameCase} case.`,
          suggestion: `Change *${collectionName}* to *${to[collectionNameCase](collectionName)}*.`,
        }
      /* istanbul ignore next Joi makes sure this can't happen */
      default: throw new Error(`Unknown case: ${collectionNameCase}`)
    }
  }
}
