import * as Joi from 'joi'

import { IDb, MapReduceResult } from '../db'
import {
  AbstractCollectionRule,
  IRuleFailureSpecificJson,
  RuleFailure,
  RuleGranularity,
} from '../rule'


export class Rule extends AbstractCollectionRule {
  private static NUMBER_CHECK_STRICT = `typeof value === 'string' && String(Number(value)) === value`
  private static NUMBER_CHECK_LOOSE = `typeof value === 'string' && !isNaN(Number(value))`
  private static MAP = (numberCheck: string, key?: string) => `
    function () {
      ${key !== undefined ? `var key = '${key}'` : 'for (var key in this) {'}
        var value = this[key];
        if (${numberCheck})
        {
            emit(key, value);
        }
      ${key !== undefined ? '' : '}'}
    }
  `
  private static REDUCE = `
    function (key, values) {
      return "'" +
        values.join("', '") +
        "'"
    }
  `

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

  public async getFailuresForCollection(
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

    let map: string
    if (this.options['strict-number-check']) {
      map = Rule.MAP(Rule.NUMBER_CHECK_STRICT, keyName)
    } else {
      map = Rule.MAP(Rule.NUMBER_CHECK_LOOSE, keyName)
    }

    return {
      failure: `Column **${collectionName}.${keyName}** contains numbers that are saved as strings.`,
      mongoCommand: `db.getCollection('${collectionName
        }').mapReduce(${map}, ${Rule.REDUCE}, { out: { inline: 1 } }).find({}, { results: 1 })`,
    }
  }
}
