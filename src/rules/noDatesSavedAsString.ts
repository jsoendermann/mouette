import { IDb } from '../db'
import {
  AbstractKeyRule,
  IRuleFailureSpecificJson,
  RuleFailure,
  RuleGranularity,
} from '../rule'


export class Rule extends AbstractKeyRule {
  // Taken from http://www.pelagodesign.com/blog/2009/05/20/iso-8601-date-validation-that-doesnt-suck/
  private static ISO_8601_DATE_REGEXP = '^([\\+-]?\\d{4}(?!\\d{2}\\' +
    'b))((-?)((0[1-9]|1[0-2])(\\3([12]\\d|0[1-9]|3[01]))?|W([0-4]\\d|' +
    '5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\\d|[12]\\d{2}|3([0-5]\\d|6[1-6' +
    '])))([T\\s]((([01]\\d|2[0-3])((:?)[0-5]\\d)?|24\\:?00)([\\.,' +
    ']\\d+(?!:))?)?(\\17[0-5]\\d([\\.,]\\d+)?)?([zZ]|([\\+-])([' +
    '01]\\d|2[0-3]):?([0-5]\\d)?)?)?)?$'

  public static metadata = {
    name: 'no-dates-saved-as-string',
    prettyName: 'No dates saved as string',
    description: "Makes sure dates don't get saved as strings.",
    rationale: 'It breaks expectations and is probably the result of serialization bugs.',
    granularity: RuleGranularity.Column,
    isFuzzy: false,
    // TODO We could make the regexp configurable
    optionsDescription: '',
    optionsSchema: {},
  }

  protected getMetadata() { return Rule.metadata }

  protected async getFailuresForCollectionAndKey(
    db: IDb,
    collectionName: string,
    keyName: string,
  ): Promise<RuleFailure[]> {
    const doesContainDatesSavedAsString = await db.doesContainInCollection(
      collectionName,
      {
        [keyName]: { $type: 2, $regex: new RegExp(Rule.ISO_8601_DATE_REGEXP) },
      },
    )

    if (doesContainDatesSavedAsString) {
      return [new RuleFailure(this, { collectionName, keyName })]
    }
    return []
  }

  public getFailureSpecificJson(failure: RuleFailure): IRuleFailureSpecificJson {
    const collectionName = failure.getCollectionName() as string
    const keyName = failure.getKeyName() as string

    return {
      failure: `Column **${collectionName}.${keyName}** contains dates that are saved as strings.`,
      mongoCommand: `db.getCollection('${collectionName
      }').find({${keyName}: {$type: 2, $regex: new RegExp("${
        Rule.ISO_8601_DATE_REGEXP.replace(/\\/g, '\\\\')}")}}, {${keyName}: 1})`,
    }
  }
}
