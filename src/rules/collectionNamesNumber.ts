import * as Joi from 'joi'

import { IDb } from '../db'
import {
  AbstractCollectionRule,
  IRuleFailureSpecificJson,
  RuleFailure,
  RuleGranularity,
  RuleSeverity,
} from '../rule'
import { isSingular, isPlural, singularize, pluralize } from '../vendor/lingo'


export class Rule extends AbstractCollectionRule {
  public static metadata = {
    name: 'collection-names-number',
    prettyName: 'Collection names number',
    description: 'Make sure all collections in the database have names that are pluralized.',
    rationale: 'Reads more fluently.',
    severity: RuleSeverity.Warning,
    granularity: RuleGranularity.CollectionName,
    isFuzzy: false,
    optionsDescription: `
      [number]
        description = "The grammatical number that collection names should be checked for."
        type = "enum"
        possibleValues = "'singular' | 'plural'"
    `,
    optionsSchema: {
      number: Joi.any().allow(['singular', 'plural']).required(),
    },
  }

  public getMetadata() { return Rule.metadata }

  public async applyForCollection(
    db: IDb,
    collectionName: string,
  ): Promise<RuleFailure | null> {
    switch (this.options.number) {
      case 'singular':
        if (!isSingular(collectionName)) {
          return new RuleFailure(this, collectionName)
        }
        return null
      case 'plural':
        if (!isPlural(collectionName)) {
          return new RuleFailure(this, collectionName)
        }
        return null
      default: throw new Error(`Options value ${this.options.number
        } provided as 'number to collection-names-number not valid`)
    }
  }

  public failureSpecificJson(failure: RuleFailure): IRuleFailureSpecificJson {
    const collectionName = failure.getCollectionName() as string

    switch (this.options.number) {
      case 'singular':
        return {
          failure: `Collection name **${collectionName}** is not singular.`,
          suggestion: `Change *${collectionName}* to *${singularize(collectionName)}*.`,
        }
      case 'plural':
        return {
          failure: `Collection name **${collectionName}** is not pluralized.`,
          suggestion: `Change *${collectionName}* to *${pluralize(collectionName)}*.`,
        }
      default: throw new Error(`Options value ${this.options.number
        } provided as 'number' to collection-names-number not valid`)
    }
  }
}
