import * as Joi from 'joi'

import { IDb } from '../db'
import {
  AbstractKeyRule,
  IRuleFailureSpecificJson,
  RuleFailure,
  RuleGranularity,
} from '../rule'


export class Rule extends AbstractKeyRule {
  private static REGEXP_STRICT = '^-?[1-9]\\d*\\.?(\\d*[1-9])?$'
  private static REGEXP_LOOSE = '^(0x|0b|-)?\\d+\\.?\\d*$'

  public static metadata = {
    name: 'no-numbers-saved-as-string',
    prettyName: 'No numbers saved as string',
    description: "Makes sure numbers don't get saved as strings.",
    rationale: 'It breaks expectations and is easy to overlook.',
    granularity: RuleGranularity.Column,
    isFuzzy: false,
    optionsDescription: `
      [strict-number-check]
        description = "When this is set to true, strings like '015', '0xF' or '0b1111 are not considered to be numbers."
        type = "boolean"
    `,
    optionsSchema: {
      'strict-number-check': Joi.bool().required(),
    },
  }

  protected getMetadata() { return Rule.metadata }

  protected async getFailuresForCollectionAndKey(
    db: IDb,
    collectionName: string,
    keyName: string,
  ): Promise<RuleFailure[]> {
    let regexp = Rule.REGEXP_LOOSE
    if (this.options['strict-number-check']) {
      regexp = Rule.REGEXP_STRICT
    }

    const doesContainNumberSavedAsString = await db.doesContainInCollection(
      collectionName,
      {
        [keyName]: { $type: 2, $regex: new RegExp(regexp) },
      },
    )

    if (doesContainNumberSavedAsString) {
      return [new RuleFailure(this, { collectionName, keyName })]
    }
    return []
  }

  public getFailureSpecificJson(failure: RuleFailure): IRuleFailureSpecificJson {
    const collectionName = failure.getCollectionName() as string
    const keyName = failure.getKeyName() as string

    const regexp = this.options['strict-number-check']
      ? Rule.REGEXP_STRICT
      : Rule.REGEXP_LOOSE

    return {
      failure: `Column **${collectionName}.${keyName}** contains numbers that are saved as strings.`,
      mongoCommand: `db.getCollection('${collectionName
      }').find({${keyName}: {$type: 2, $regex: new RegExp('${regexp.replace(/\\/g, '\\\\')}')}}, {${keyName}: 1})`,
    }
  }
}
