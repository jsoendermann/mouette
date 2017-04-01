import * as Joi from 'joi'

import { IDb, MapReduceResult } from '../db'
import {
  AbstractCollectionRule,
  IRuleFailureSpecificJson,
  RuleFailure,
  RuleGranularity,
} from '../rule'


// TODO Rewrite this to exclusively use regexp
export class Rule extends AbstractCollectionRule {
  private static NUMBER_CHECK_STRICT = `typeof value === 'string' && String(Number(value)) === value`
  private static NUMBER_CHECK_LOOSE = `typeof value === 'string' && !isNaN(Number(value))`
  private static MAP = (numberCheck: string) => `
    function () {
      for (var key in this) {
        var value = this[key];
        if (${numberCheck})
        {
            emit(key, value);
        }
      }
    }
  `
  private static REDUCE = 'function () {}'

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
        description = "When this is set to true, strings like '015', '0xF' or '0b1111 are ignored."
        type = "boolean"
    `,
    optionsSchema: {
      'strict-number-check': Joi.bool().required(),
    },
  }

  protected getMetadata() { return Rule.metadata }

  protected async getFailuresForCollection(
    db: IDb,
    collectionName: string,
  ): Promise<RuleFailure[]> {
    let mapReduceResult: MapReduceResult

    if (this.options['strict-number-check']) {
      mapReduceResult = await db.mapReduceOnCollection(
        collectionName,
        Rule.MAP(Rule.NUMBER_CHECK_STRICT),
        Rule.REDUCE,
      )
    } else {
      mapReduceResult = await db.mapReduceOnCollection(
        collectionName,
        Rule.MAP(Rule.NUMBER_CHECK_LOOSE),
        Rule.REDUCE,
      )
    }

    return mapReduceResult.map(res => (
      new RuleFailure(this, { collectionName, keyName: res._id })
    ))
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
