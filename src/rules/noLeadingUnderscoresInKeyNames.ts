import { IDb } from '../db'
import {
  AbstractKeyRule,
  IRuleFailureSpecificJson,
  RuleFailure,
  RuleGranularity,
} from '../rule'


export class Rule extends AbstractKeyRule {
  public static metadata = {
    name: 'no-leading-underscores-in-key-names',
    prettyName: 'No leading underscores in key names',
    description: 'Make sure no key name except _id starts with an underscore.',
    rationale: 'It suggests the data is used internally.',
    granularity: RuleGranularity.KeyName,
    isFuzzy: false,
    optionsDescription: '',
    optionsSchema: {},
  }

  public getMetadata() { return Rule.metadata }

  public async getFailuresForCollectionAndKey(
    db: IDb,
    collectionName: string,
    keyName: string,
  ): Promise<RuleFailure[]> {
    if (keyName !== '_id' && keyName[0] === '_') {
      return [new RuleFailure(this, { collectionName, keyName })]
    }
    return []
  }

  public getFailureSpecificJson(failure: RuleFailure): IRuleFailureSpecificJson {
    const collectionName = failure.getCollectionName() as string
    const keyName = failure.getKeyName() as string

    const result: any = {
      failure: `Key name **${collectionName}.${keyName}** should not start with an underscore.`,
    }

    if (keyName === '__v') {
      result.suggestion = "Configure mongoose so it doesn't create a __v key."
    }

    return result
  }
}
