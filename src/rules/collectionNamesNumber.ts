import * as Joi from 'joi'

import { IDb } from '../db'
import {
  AbstractCollectionRule,
  IRuleFailureSpecificJson,
  RuleFailure,
  RuleGranularity,
} from '../rule'
import { isSingular, isPlural, singularize, pluralize } from '../vendor/lingo'


export class Rule extends AbstractCollectionRule {
  public static metadata = {
    name: 'collection-names-number',
    prettyName: 'Collection names number',
    description: 'Make sure all collections in the database have names that are pluralized.',
    rationale: 'Reads more fluently.',
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

  protected getMetadata() { return Rule.metadata }

  protected async getFailuresForCollection(
    db: IDb,
    collectionName: string,
  ): Promise<RuleFailure[]> {
    type numberOption = 'singular' | 'plural'
    // Joi makes sure we don't need a default case
    // tslint:disable-next-line:switch-default
    switch (this.options.number as numberOption) {
      case 'singular':
        if (!isSingular(collectionName)) {
          return [new RuleFailure(this, { collectionName })]
        }
        return []
      case 'plural':
        if (!isPlural(collectionName)) {
          return [new RuleFailure(this, { collectionName })]
        }
        return []
    }
  }

  public getFailureSpecificJson(failure: RuleFailure): IRuleFailureSpecificJson {
    const collectionName = failure.getCollectionName() as string

    type numberOption = 'singular' | 'plural'
    // Joi makes sure we don't need a default case
    // tslint:disable-next-line:switch-default
    switch (this.options.number as numberOption) {
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
    }
  }
}
